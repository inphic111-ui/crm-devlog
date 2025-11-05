import React, { useState, useEffect } from 'react'
import { Line, Pie, Bar, Doughnut } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
)

function Dashboard() {
    const [stats, setStats] = useState({
        totalCustomers: 1234,
        newCustomers: 234,
        repeatCustomers: 567,
        regularCustomers: 89,
        totalSales: 1234567,
        avgOrderValue: 5678
    })

    // 銷售趨勢數據
    const salesTrendData = {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        datasets: [{
            label: '銷售額',
            data: [65000, 75000, 85000, 95000, 105000, 115000, 125000, 135000, 145000, 155000, 165000, 175000],
            borderColor: '#0066CC',
            backgroundColor: 'rgba(0, 102, 204, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#0066CC',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
        }]
    }

    // 客戶分類分布
    const customerDistributionData = {
        labels: ['蛻魚客戶', '鯰魚客戶', '車魚客戶', '小蝦客戶'],
        datasets: [{
            data: [30, 25, 35, 10],
            backgroundColor: [
                '#0066CC',
                '#3399FF',
                '#66CCFF',
                '#99DDFF'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    }

    // 購買階段分布
    const purchaseStageData = {
        labels: ['新客', '首購客', '回購客', '常客'],
        datasets: [{
            label: '客戶數',
            data: [234, 345, 456, 199],
            backgroundColor: [
                '#0066CC',
                '#3399FF',
                '#66CCFF',
                '#99DDFF'
            ],
            borderColor: '#0052A3',
            borderWidth: 1
        }]
    }

    // 客戶評分分布
    const cviDistributionData = {
        labels: ['CVI > 8', 'CVI 5-8', 'CVI 3-5', 'CVI < 3'],
        datasets: [{
            label: '客戶數',
            data: [150, 280, 520, 284],
            backgroundColor: [
                '#0052A3',
                '#0066CC',
                '#3399FF',
                '#66CCFF'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: '#003366',
                    font: {
                        size: 12,
                        weight: '500'
                    }
                }
            }
        },
        scales: {
            y: {
                ticks: {
                    color: '#003366'
                },
                grid: {
                    color: 'rgba(0, 102, 204, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#003366'
                },
                grid: {
                    color: 'rgba(0, 102, 204, 0.1)'
                }
            }
        }
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1>戰情室</h1>
                <p>實時監控客戶數據和銷售業績</p>
            </div>

            {/* KPI 卡片 */}
            <div className="grid grid-4">
                <div className="kpi-card">
                    <h3>總客戶數</h3>
                    <div className="value">{stats.totalCustomers.toLocaleString()}</div>
                    <div className="change">📈 +12% 本月</div>
                </div>
                <div className="kpi-card">
                    <h3>新客戶</h3>
                    <div className="value">{stats.newCustomers.toLocaleString()}</div>
                    <div className="change">📈 +8% 本月</div>
                </div>
                <div className="kpi-card">
                    <h3>回購客戶</h3>
                    <div className="value">{stats.repeatCustomers.toLocaleString()}</div>
                    <div className="change">📈 +15% 本月</div>
                </div>
                <div className="kpi-card">
                    <h3>常客</h3>
                    <div className="value">{stats.regularCustomers.toLocaleString()}</div>
                    <div className="change">📈 +5% 本月</div>
                </div>
            </div>

            {/* 圖表區域 */}
            <div className="grid grid-2">
                {/* 銷售趨勢 */}
                <div className="chart-container">
                    <h3>銷售趨勢</h3>
                    <div style={{ position: 'relative', height: '300px' }}>
                        <Line data={salesTrendData} options={chartOptions} />
                    </div>
                </div>

                {/* 客戶分類分布 */}
                <div className="chart-container">
                    <h3>客戶分類分布</h3>
                    <div style={{ position: 'relative', height: '300px' }}>
                        <Pie data={customerDistributionData} options={chartOptions} />
                    </div>
                </div>

                {/* 購買階段分布 */}
                <div className="chart-container">
                    <h3>購買階段分布</h3>
                    <div style={{ position: 'relative', height: '300px' }}>
                        <Bar data={purchaseStageData} options={chartOptions} />
                    </div>
                </div>

                {/* 客戶評分分布 */}
                <div className="chart-container">
                    <h3>客戶評分分布 (CVI)</h3>
                    <div style={{ position: 'relative', height: '300px' }}>
                        <Doughnut data={cviDistributionData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* 銷售數據摘要 */}
            <div className="card" style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '20px', color: '#003366' }}>銷售數據摘要</h3>
                <table>
                    <thead>
                        <tr>
                            <th>指標</th>
                            <th>本月</th>
                            <th>上月</th>
                            <th>變化</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>總銷售額</td>
                            <td>¥{stats.totalSales.toLocaleString()}</td>
                            <td>¥1,100,000</td>
                            <td><span style={{ color: '#00AA00' }}>+12%</span></td>
                        </tr>
                        <tr>
                            <td>平均客單價</td>
                            <td>¥{stats.avgOrderValue.toLocaleString()}</td>
                            <td>¥5,200</td>
                            <td><span style={{ color: '#00AA00' }}>+9%</span></td>
                        </tr>
                        <tr>
                            <td>客戶留存率</td>
                            <td>87%</td>
                            <td>85%</td>
                            <td><span style={{ color: '#00AA00' }}>+2%</span></td>
                        </tr>
                        <tr>
                            <td>新客轉化率</td>
                            <td>23%</td>
                            <td>20%</td>
                            <td><span style={{ color: '#00AA00' }}>+3%</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Dashboard
