import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './styles/global.css'
import './styles/layout.css'

// 頁面導入
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Recordings from './pages/Recordings'
import KnowledgeBase from './pages/KnowledgeBase'
import UserManagement from './pages/UserManagement'

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    return (
        <Router>
            <div className="app-container">
                {/* 頂部導航欄 */}
                <header className="navbar">
                    <div className="navbar-content">
                        <button 
                            className="menu-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            ☰
                        </button>
                        <div className="navbar-brand">
                            <h1>CRM 3.0</h1>
                            <p>客戶關係管理系統</p>
                        </div>
                        <div className="navbar-user">
                            <span>歡迎使用</span>
                        </div>
                    </div>
                </header>

                <div className="main-container">
                    {/* 左側菜單欄 */}
                    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                        <nav className="sidebar-nav">
                            <Link to="/" className="nav-item">
                                <span className="icon">📊</span>
                                <span className="label">戰情室</span>
                            </Link>
                            <Link to="/customers" className="nav-item">
                                <span className="icon">👥</span>
                                <span className="label">客戶資料</span>
                            </Link>
                            <Link to="/recordings" className="nav-item">
                                <span className="icon">🎙️</span>
                                <span className="label">錄音管理</span>
                            </Link>
                            <Link to="/knowledge-base" className="nav-item">
                                <span className="icon">📚</span>
                                <span className="label">知識庫</span>
                            </Link>
                            <Link to="/users" className="nav-item">
                                <span className="icon">⚙️</span>
                                <span className="label">使用者管理</span>
                            </Link>
                        </nav>
                    </aside>

                    {/* 主內容區域 */}
                    <main className="content">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/recordings" element={<Recordings />} />
                            <Route path="/knowledge-base" element={<KnowledgeBase />} />
                            <Route path="/users" element={<UserManagement />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    )
}

export default App
