import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// 日誌存儲
const logs = [];
const MAX_LOGS = 1000;

// 添加日誌
function addLog(level, message, data = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    id: logs.length
  };
  logs.unshift(logEntry);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
  console.log(`[${level}] ${message}`, data || '');
}

// 環境配置
const config = {
  offline: {
    name: 'OFFLINE (測試)',
    dbUrl: process.env.OFFLINE_DB_URL || process.env.DATABASE_URL,
    logFile: '/tmp/offline.log'
  },
  online: {
    name: 'ONLINE (正式)',
    dbUrl: process.env.ONLINE_DB_URL,
    logFile: '/tmp/online.log'
  }
};

// 創建數據庫連接池
const pools = {};

function createPool(env) {
  if (!config[env].dbUrl) {
    addLog('warn', `${env.toUpperCase()} 數據庫 URL 未配置`);
    return null;
  }

  try {
    pools[env] = new Pool({
      connectionString: config[env].dbUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pools[env].on('error', (err) => {
      addLog('error', `${env.toUpperCase()} 數據庫連接池錯誤`, err.message);
    });

    addLog('info', `${env.toUpperCase()} 數據庫連接池已創建`);
    return pools[env];
  } catch (err) {
    addLog('error', `創建 ${env.toUpperCase()} 連接池失敗`, err.message);
    return null;
  }
}

// 初始化連接池
createPool('offline');
createPool('online');

// API: 獲取日誌
app.get('/api/logs', (req, res) => {
  const { level, limit = 100, offset = 0 } = req.query;
  let filtered = logs;

  if (level && level !== 'all') {
    filtered = logs.filter(log => log.level === level);
  }

  const paginated = filtered.slice(offset, offset + parseInt(limit));
  res.json({
    total: filtered.length,
    offset: parseInt(offset),
    limit: parseInt(limit),
    logs: paginated
  });
});

// API: 清空日誌
app.post('/api/logs/clear', (req, res) => {
  logs.length = 0;
  addLog('info', '日誌已清空');
  res.json({ success: true, message: '日誌已清空' });
});

// API: 獲取環境狀態
app.get('/api/environments', async (req, res) => {
  const environments = {};

  for (const [env, cfg] of Object.entries(config)) {
    const pool = pools[env];
    let status = 'disconnected';
    let error = null;
    let dbInfo = null;

    if (pool) {
      try {
        const result = await pool.query('SELECT version();');
        status = 'connected';
        dbInfo = {
          version: result.rows[0].version,
          poolSize: pool.totalCount,
          idleCount: pool.idleCount
        };
      } catch (err) {
        status = 'error';
        error = err.message;
      }
    }

    environments[env] = {
      name: cfg.name,
      status,
      error,
      dbInfo,
      dbUrl: cfg.dbUrl ? '已配置' : '未配置'
    };
  }

  res.json(environments);
});

// API: 執行 SQL 查詢
app.post('/api/query', async (req, res) => {
  const { env, sql } = req.body;

  if (!env || !sql) {
    return res.status(400).json({ error: '缺少 env 或 sql 參數' });
  }

  if (!['offline', 'online'].includes(env)) {
    return res.status(400).json({ error: '無效的環境' });
  }

  const pool = pools[env];
  if (!pool) {
    return res.status(503).json({ error: `${env.toUpperCase()} 數據庫未連接` });
  }

  try {
    addLog('info', `執行查詢 [${env}]`, sql.substring(0, 100));
    const result = await pool.query(sql);
    res.json({
      success: true,
      rowCount: result.rowCount,
      rows: result.rows,
      fields: result.fields.map(f => ({ name: f.name, type: f.dataTypeID }))
    });
  } catch (err) {
    addLog('error', `查詢失敗 [${env}]`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// API: 獲取表格列表
app.get('/api/tables/:env', async (req, res) => {
  const { env } = req.params;

  if (!['offline', 'online'].includes(env)) {
    return res.status(400).json({ error: '無效的環境' });
  }

  const pool = pools[env];
  if (!pool) {
    return res.status(503).json({ error: `${env.toUpperCase()} 數據庫未連接` });
  }

  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    res.json({ tables: result.rows.map(r => r.table_name) });
  } catch (err) {
    addLog('error', `獲取表格列表失敗 [${env}]`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// API: 獲取表格數據
app.get('/api/table/:env/:table', async (req, res) => {
  const { env, table } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  if (!['offline', 'online'].includes(env)) {
    return res.status(400).json({ error: '無效的環境' });
  }

  const pool = pools[env];
  if (!pool) {
    return res.status(503).json({ error: `${env.toUpperCase()} 數據庫未連接` });
  }

  try {
    // 驗證表名（防止 SQL 注入）
    const tableCheck = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    `, [table]);

    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ error: '表格不存在' });
    }

    // 獲取行數
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
    const total = parseInt(countResult.rows[0].count);

    // 獲取數據
    const result = await pool.query(`
      SELECT * FROM "${table}" 
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    res.json({
      table,
      total,
      offset: parseInt(offset),
      limit: parseInt(limit),
      rows: result.rows,
      columns: result.fields.map(f => ({ name: f.name, type: f.dataTypeID }))
    });
  } catch (err) {
    addLog('error', `獲取表格數據失敗 [${env}:${table}]`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// API: 數據遷移 - 從 OFFLINE 複製到 ONLINE
app.post('/api/migrate', async (req, res) => {
  const { table } = req.body;

  if (!table) {
    return res.status(400).json({ error: '缺少 table 參數' });
  }

  const offlinePool = pools['offline'];
  const onlinePool = pools['online'];

  if (!offlinePool || !onlinePool) {
    return res.status(503).json({ error: '數據庫連接不完整' });
  }

  try {
    addLog('info', `開始遷移表格 [${table}]`);

    // 獲取 OFFLINE 的數據
    const sourceResult = await offlinePool.query(`SELECT * FROM "${table}"`);
    const rows = sourceResult.rows;

    if (rows.length === 0) {
      addLog('warn', `表格 [${table}] 為空`);
      return res.json({ success: true, message: '表格為空，無需遷移', rowCount: 0 });
    }

    // 清空 ONLINE 的表格
    await onlinePool.query(`TRUNCATE TABLE "${table}" CASCADE`);
    addLog('info', `已清空 ONLINE 表格 [${table}]`);

    // 插入數據
    const columns = Object.keys(rows[0]);
    const columnNames = columns.map(c => `"${c}"`).join(', ');
    
    for (const row of rows) {
      const values = columns.map(c => row[c]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      await onlinePool.query(
        `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})`,
        values
      );
    }

    addLog('info', `表格 [${table}] 遷移完成，共 ${rows.length} 行`);
    res.json({ success: true, message: `遷移成功，共 ${rows.length} 行`, rowCount: rows.length });
  } catch (err) {
    addLog('error', `遷移失敗 [${table}]`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// API: 遷移所有表格
app.post('/api/migrate-all', async (req, res) => {
  const offlinePool = pools['offline'];
  const onlinePool = pools['online'];

  if (!offlinePool || !onlinePool) {
    return res.status(503).json({ error: '數據庫連接不完整' });
  }

  try {
    addLog('info', '開始遷移所有表格');

    // 獲取所有表格
    const tableResult = await offlinePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = tableResult.rows.map(r => r.table_name);
    const results = [];

    for (const table of tables) {
      try {
        const sourceResult = await offlinePool.query(`SELECT * FROM "${table}"`);
        const rows = sourceResult.rows;

        if (rows.length === 0) {
          results.push({ table, status: 'skipped', rowCount: 0 });
          continue;
        }

        // 清空 ONLINE 的表格
        await onlinePool.query(`TRUNCATE TABLE "${table}" CASCADE`);

        // 插入數據
        const columns = Object.keys(rows[0]);
        const columnNames = columns.map(c => `"${c}"`).join(', ');
        
        for (const row of rows) {
          const values = columns.map(c => row[c]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          await onlinePool.query(
            `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})`,
            values
          );
        }

        results.push({ table, status: 'success', rowCount: rows.length });
        addLog('info', `表格 [${table}] 遷移完成，共 ${rows.length} 行`);
      } catch (err) {
        results.push({ table, status: 'error', error: err.message });
        addLog('error', `表格 [${table}] 遷移失敗`, err.message);
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    addLog('error', '遷移所有表格失敗', err.message);
    res.status(400).json({ error: err.message });
  }
});

// API: 合併表格 - 從 OFFLINE 添加到 ONLINE（不覆蓋）
app.post('/api/merge', async (req, res) => {
  const { table } = req.body;

  if (!table) {
    return res.status(400).json({ error: '缺少 table 參數' });
  }

  const offlinePool = pools['offline'];
  const onlinePool = pools['online'];

  if (!offlinePool || !onlinePool) {
    return res.status(503).json({ error: '數據庫連接不完整' });
  }

  try {
    addLog('info', `開始合併表格 [${table}]`);

    // 獲取 OFFLINE 的數據
    const sourceResult = await offlinePool.query(`SELECT * FROM "${table}"`);
    const offlineRows = sourceResult.rows;

    if (offlineRows.length === 0) {
      addLog('warn', `表格 [${table}] 為空`);
      return res.json({ success: true, message: '表格為空，無需合併', mergedCount: 0 });
    }

    // 獲取 ONLINE 的現有數據
    const onlineCountResult = await onlinePool.query(`SELECT COUNT(*) as count FROM "${table}"`);
    const onlineCountBefore = parseInt(onlineCountResult.rows[0].count);

    // 插入新數據（避免重複）
    const columns = Object.keys(offlineRows[0]);
    const columnNames = columns.map(c => `"${c}"`).join(', ');
    let mergedCount = 0;
    let duplicateCount = 0;

    for (const row of offlineRows) {
      try {
        const values = columns.map(c => row[c]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        await onlinePool.query(
          `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})`,
          values
        );
        mergedCount++;
      } catch (err) {
        // 如果是重複鍵錯誤，跳過
        if (err.code === '23505') {
          duplicateCount++;
        } else {
          throw err;
        }
      }
    }

    // 獲取合併後的計數
    const onlineCountResult = await onlinePool.query(`SELECT COUNT(*) as count FROM "${table}"`);
    const onlineCountAfter = parseInt(onlineCountResult.rows[0].count);

    addLog('info', `表格 [${table}] 合併完成，合併 ${mergedCount} 行，重複 ${duplicateCount} 行`);
    
    res.json({ 
      success: true, 
      message: `合併成功，共合併 ${mergedCount} 行，跳過重複 ${duplicateCount} 行`, 
      offlineCount: offlineRows.length,
      onlineCountBefore,
      mergedCount,
      duplicateCount,
      onlineCountAfter
    });
  } catch (err) {
    addLog('error', `合併失敗 [${table}]`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// API: 驗證數據完整性
app.post('/api/verify', async (req, res) => {
  const { table } = req.body;

  if (!table) {
    return res.status(400).json({ error: '缺少 table 參數' });
  }

  const offlinePool = pools['offline'];
  const onlinePool = pools['online'];

  if (!offlinePool || !onlinePool) {
    return res.status(503).json({ error: '數據庫連接不完整' });
  }

  try {
    addLog('info', `驗證表格 [${table}] 數據完整性`);

    const offlineCount = await offlinePool.query(`SELECT COUNT(*) as count FROM "${table}"`);
    const onlineCount = await onlinePool.query(`SELECT COUNT(*) as count FROM "${table}"`);

    const offlineRows = parseInt(offlineCount.rows[0].count);
    const onlineRows = parseInt(onlineCount.rows[0].count);

    const match = offlineRows === onlineRows;
    const status = match ? 'success' : 'mismatch';

    addLog('info', `驗證完成 [${table}]: OFFLINE=${offlineRows}, ONLINE=${onlineRows}`);

    res.json({
      table,
      status,
      offlineRows,
      onlineRows,
      match
    });
  } catch (err) {
    addLog('error', `驗證失敗 [${table}]`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// 首頁
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// 啟動服務器
app.listen(PORT, () => {
  addLog('info', `DevLog 服務器啟動成功，監聽端口 ${PORT}`);
  console.log(`🚀 DevLog 服務器運行在 http://localhost:${PORT}`);
});

// 優雅關閉
process.on('SIGTERM', async () => {
  addLog('info', '收到 SIGTERM，開始優雅關閉');
  for (const pool of Object.values(pools)) {
    if (pool) {
      await pool.end();
    }
  }
  process.exit(0);
});
