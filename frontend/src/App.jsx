import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "./components/Sidebar"
import Dashboard from "./components/Dashboard"
import Transactions from "./components/Transactions"
import Budget from "./components/Budget"
import Accounts from "./components/Accounts"
import CashFlow from "./components/CashFlow"
import Reports   from "./components/Reports"
import Recurring from "./components/Recurring"
import Goals    from "./components/Goals"
import Investments  from "./components/Investments"
import Forecasting  from "./components/Forecasting"
import Advice       from "./components/Advice"
import Insights     from "./components/Insights"

const API = "http://127.0.0.1:8000/api/transactions/"

function App() {
  const [activePage, setActivePage] = useState("dashboard")
  const [transactions, setTransactions] = useState([])
  const [form, setForm] = useState({
    title: "", amount: "", transaction_type: "expense", category: "", parent_category: "", date: "", note: ""
  })

  useEffect(() => { fetchTransactions() }, [])

  const fetchTransactions = () => {
    axios.get(API).then(res => setTransactions(res.data))
  }

  const handleSubmit = () => {
    axios.post(API, form).then(() => {
      fetchTransactions()
      setForm({ title: "", amount: "", transaction_type: "expense", category: "", parent_category: "", date: "", note: "" })
    })
  }

  const handleDelete = (id) => {
    axios.delete(`${API}${id}/`).then(fetchTransactions)
  }

  const handlePatchTransaction = (id, patch) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  const renderPage = () => {
    switch(activePage) {
      case "dashboard": return <Dashboard transactions={transactions} />
      case "transactions": return <Transactions transactions={transactions} form={form}
        setForm={setForm} handleSubmit={handleSubmit} handleDelete={handleDelete}
        onUpdateTransaction={handlePatchTransaction} />
      case "budget": return <Budget transactions={transactions} onUpdateTransaction={handlePatchTransaction} />
      case "accounts": return <Accounts />
      case "cashflow": return <CashFlow transactions={transactions} />
      case "reports":    return <Reports    transactions={transactions} />
      case "recurring":  return <Recurring />
      case "goals":        return <Goals />
      case "investments":  return <Investments />
      case "forecasting":  return <Forecasting />
      case "advice":       return <Advice />
      case "insights":     return <Insights transactions={transactions} />
      default: return <Dashboard transactions={transactions} />
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9f7f2", fontFamily: "sans-serif" }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main style={{
        marginLeft: 260,
        flex: 1,
        padding: "40px",
        boxSizing: "border-box",
        width: "calc(100vw - 260px)",
        minWidth: 0,
        height: "100vh",
        overflowY: "auto"
      }}>
        {renderPage()}
      </main>
    </div>
  )
}

export default App