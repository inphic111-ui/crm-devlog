import React, { useState } from 'react'

function Customers() {
    const [customers, setCustomers] = useState([
        { id: 1, name: '客戶 A', company: '公司 A', capital: '上市', nfvp: 8.5, status: '蛻魚客戶' },
        { id: 2, name: '客戶 B', company: '公司 B', capital: '未上市', nfvp: 6.2, status: '鯰魚客戶' },
        { id: 3, name: '客戶 C', company: '公司 C', capital: '上市', nfvp: 7.8, status: '車魚客戶' },
    ])

    return (
        <div className="customers-page">
            <div className="page-header">
                <h1>客戶資料</h1>
                <p>管理和查看所有客戶信息</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ color: '#003366' }}>客戶清單</h3>
                    <button>+ 新增客戶</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>客戶編號</th>
                            <th>客戶名稱</th>
                            <th>公司名稱</th>
                            <th>資本額</th>
                            <th>NFVP 評分</th>
                            <th>客戶分類</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.id}>
                                <td>{customer.id}</td>
                                <td>{customer.name}</td>
                                <td>{customer.company}</td>
                                <td>{customer.capital}</td>
                                <td>
                                    <span style={{
                                        color: customer.nfvp > 8 ? '#0066CC' : '#666666'
                                    }}>
                                        {customer.nfvp}
                                    </span>
                                </td>
                                <td>{customer.status}</td>
                                <td>
                                    <button style={{ padding: '5px 10px', fontSize: '12px' }}>編輯</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Customers
