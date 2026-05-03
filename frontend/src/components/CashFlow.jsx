import { useState, useMemo, useEffect, useRef } from "react"
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"

const MONTH_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const fmt = (n) =>
  "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtAxis = (v) => {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
  return v === 0 ? "$0" : `$${v}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "12px 16px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 13, minWidth: 180,
    }}>
      <div style={{ fontWeight: "700", color: "#2d4a3e", marginBottom: 10 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 5 }}>
          <span style={{ color: "#5a6b5a" }}>{p.name}</span>
          <span style={{ fontWeight: "600", color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function CategorySection({ title, total, data, color, open, setOpen, emptyMsg }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const maxVal = entries.length ? entries[0][1] : 1

  return (
    <div style={{
      background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      marginBottom: 16, overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", cursor: "pointer",
          borderBottom: open && entries.length ? "1px solid #f9f7f2" : "none",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#fafcff"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {open ? <ChevronDown size={16} color="#5a6b5a" /> : <ChevronRight size={16} color="#5a6b5a" />}
          <span style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e" }}>{title}</span>
          <span style={{ fontSize: 12, color: "#a0afc0" }}>{entries.length} categor{entries.length !== 1 ? "ies" : "y"}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: "700", color }}>{fmt(total)}</div>
      </div>

      {open && (
        <div style={{ padding: "8px 20px 16px" }}>
          {entries.length === 0
            ? <p style={{ color: "#a0afc0", fontSize: 13, margin: "12px 0" }}>{emptyMsg}</p>
            : entries.map(([cat, amount]) => {
                const pct = total > 0 ? (amount / total) * 100 : 0
                const barW = total > 0 ? (amount / maxVal) * 100 : 0
                return (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f5f2eb" }}>
                    <div style={{ width: 120, fontSize: 13, fontWeight: "500", color: "#2d4a3e", flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cat}
                    </div>
                    <div style={{ flex: 1, background: "#f9f7f2", borderRadius: 999, height: 6 }}>
                      <div style={{ width: `${barW}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#a0afc0", width: 38, textAlign: "right", flexShrink: 0 }}>
                      {pct.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 13, fontWeight: "600", color: "#2d4a3e", width: 80, textAlign: "right", flexShrink: 0 }}>
                      {fmt(amount)}
                    </div>
                  </div>
                )
              })
          }
        </div>
      )}
    </div>
  )
}

function CashFlow({ transactions }) {
  const today = new Date()
  const [period, setPeriod] = useState("monthly")
  const [selYear, setSelYear] = useState(today.getFullYear())
  const [selMonth, setSelMonth] = useState(today.getMonth())
  const [selQuarter, setSelQuarter] = useState(Math.floor(today.getMonth() / 3))
  const [incomeOpen, setIncomeOpen] = useState(true)
  const [expensesOpen, setExpensesOpen] = useState(true)
  const initialized = useRef(false)
  const latestData = useRef({ year: today.getFullYear(), month: today.getMonth(), quarter: Math.floor(today.getMonth() / 3) })

  useEffect(() => {
    if (!initialized.current && transactions.length > 0) {
      const latest = transactions.reduce((a, t) => t.date > a ? t.date : a, "")
      const [y, m] = latest.slice(0, 7).split("-").map(Number)
      const month = m - 1
      latestData.current = { year: y, month, quarter: Math.floor(month / 3) }
      setSelYear(y)
      setSelMonth(month)
      setSelQuarter(Math.floor(month / 3))
      initialized.current = true
    }
  }, [transactions])

  const handlePeriodChange = (p) => {
    setPeriod(p)
    setSelYear(latestData.current.year)
    setSelMonth(latestData.current.month)
    setSelQuarter(latestData.current.quarter)
  }

  const navigate = (dir) => {
    if (period === "monthly") {
      let m = selMonth + dir, y = selYear
      if (m < 0)  { m = 11; y-- }
      if (m > 11) { m = 0;  y++ }
      setSelMonth(m); setSelYear(y)
    } else if (period === "quarterly") {
      let q = selQuarter + dir, y = selYear
      if (q < 0) { q = 3; y-- }
      if (q > 3) { q = 0; y++ }
      setSelQuarter(q); setSelYear(y)
    } else {
      setSelYear(y => y + dir)
    }
  }

  // Chart data: last 12 months / 4 quarters of selYear / 4 years around selYear
  const chartData = useMemo(() => {
    if (period === "monthly") {
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const txns = transactions.filter(t => t.date.startsWith(key))
        const income   = txns.filter(t => t.transaction_type === "income").reduce((s, t) => s + parseFloat(t.amount), 0)
        const expenses = txns.filter(t => t.transaction_type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0)
        return { label: `${MONTH_SHORT[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`, income, expenses, net: income - expenses }
      })
    }
    if (period === "quarterly") {
      return [0, 1, 2, 3].map(q => {
        const months = [0, 1, 2].map(m => `${selYear}-${String(q * 3 + m + 1).padStart(2, "0")}`)
        const txns = transactions.filter(t => months.some(m => t.date.startsWith(m)))
        const income   = txns.filter(t => t.transaction_type === "income").reduce((s, t) => s + parseFloat(t.amount), 0)
        const expenses = txns.filter(t => t.transaction_type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0)
        return { label: `Q${q + 1} ${selYear}`, income, expenses, net: income - expenses }
      })
    }
    return [-2, -1, 0, 1].map(offset => {
      const year = selYear + offset
      const txns = transactions.filter(t => t.date.startsWith(String(year)))
      const income   = txns.filter(t => t.transaction_type === "income").reduce((s, t) => s + parseFloat(t.amount), 0)
      const expenses = txns.filter(t => t.transaction_type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0)
      return { label: String(year), income, expenses, net: income - expenses }
    })
  }, [transactions, period, selYear])

  // Transactions for selected period (summary + categories)
  const selTxns = useMemo(() => {
    if (period === "monthly") {
      const key = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`
      return transactions.filter(t => t.date.startsWith(key))
    }
    if (period === "quarterly") {
      const months = [0, 1, 2].map(m => `${selYear}-${String(selQuarter * 3 + m + 1).padStart(2, "0")}`)
      return transactions.filter(t => months.some(m => t.date.startsWith(m)))
    }
    return transactions.filter(t => t.date.startsWith(String(selYear)))
  }, [transactions, period, selYear, selMonth, selQuarter])

  const selLabel = period === "monthly"
    ? `${MONTH_LONG[selMonth]} ${selYear}`
    : period === "quarterly"
    ? `Q${selQuarter + 1} ${selYear}`
    : String(selYear)

  const totalIncome   = selTxns.filter(t => t.transaction_type === "income").reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpenses = selTxns.filter(t => t.transaction_type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalSavings  = totalIncome - totalExpenses
  const savingsRate   = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

  const aggregateByCategory = (type) =>
    selTxns.filter(t => t.transaction_type === type).reduce((acc, t) => {
      const cat = t.category || "Uncategorized"
      acc[cat] = (acc[cat] || 0) + parseFloat(t.amount)
      return acc
    }, {})

  const incomeByCategory   = aggregateByCategory("income")
  const expensesByCategory = aggregateByCategory("expense")

  const barSize = period === "monthly" ? 12 : 32

  const summaryCards = [
    { label: "Income",       value: fmt(totalIncome),   color: "#4caf84", sub: "Total received" },
    { label: "Expenses",     value: fmt(totalExpenses), color: "#e07070", sub: "Total spent" },
    {
      label: "Net Savings",
      value: (totalSavings < 0 ? "−" : "+") + fmt(totalSavings),
      color: totalSavings >= 0 ? "#5b8fd4" : "#e07070",
      sub: "Income − Expenses",
    },
    {
      label: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      color: savingsRate >= 20 ? "#4caf84" : savingsRate >= 0 ? "#f0a070" : "#e07070",
      sub: "% of income saved",
    },
  ]

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", margin: 0 }}>Cash Flow</h1>
        <div style={{ display: "flex", background: "#fff", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", gap: 2 }}>
          {["monthly", "quarterly", "yearly"].map(p => (
            <button key={p} onClick={() => handlePeriodChange(p)} style={{
              padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: "600",
              background: period === p ? "#2d4a3e" : "transparent",
              color: period === p ? "#c8e6c9" : "#5a6b5a",
              transition: "all 0.15s",
            }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart card */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 20px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barGap={3} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#f9f7f2" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#5a6b5a", fontSize: 12 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={fmtAxis}
              tick={{ fill: "#5a6b5a", fontSize: 11 }}
              axisLine={false} tickLine={false}
              width={54}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(168,197,232,0.08)" }} />
            <Legend
              wrapperStyle={{ paddingTop: 18, fontSize: 13 }}
              formatter={(val) => <span style={{ color: "#5a6b5a", fontWeight: "500" }}>{val}</span>}
            />
            <Bar dataKey="income"   name="Income"       fill="#4caf84" radius={[4, 4, 0, 0]} barSize={barSize} />
            <Bar dataKey="expenses" name="Expenses"     fill="#e07070" radius={[4, 4, 0, 0]} barSize={barSize} />
            <Line
              dataKey="net" name="Net Savings"
              stroke="#2d4a3e" strokeWidth={2.5}
              dot={{ fill: "#2d4a3e", r: 3.5, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#2d4a3e" }}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Period navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 4 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "#f9f7f2", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d4a3e" }}
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ fontSize: 15, fontWeight: "700", color: "#2d4a3e", minWidth: 170, textAlign: "center" }}>
            {selLabel}
          </div>
          <button
            onClick={() => navigate(1)}
            style={{ background: "#f9f7f2", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d4a3e" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {summaryCards.map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: "600", color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: "700", color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#a0afc0", marginTop: 6 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Category breakdowns */}
      <CategorySection
        title="Income"    total={totalIncome}
        data={incomeByCategory}   color="#4caf84"
        open={incomeOpen}   setOpen={setIncomeOpen}
        emptyMsg={`No income recorded for ${selLabel}.`}
      />
      <CategorySection
        title="Expenses"  total={totalExpenses}
        data={expensesByCategory} color="#e07070"
        open={expensesOpen} setOpen={setExpensesOpen}
        emptyMsg={`No expenses recorded for ${selLabel}.`}
      />
    </div>
  )
}

export default CashFlow
