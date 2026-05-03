import { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts"

const today = new Date()

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const PARENT_CATS = new Set([
  "Income",
  "Food", "Food & Dining",
  "Transport", "Transportation",
  "Health", "Health & Fitness",
  "Entertainment",
  "Social",
  "Shopping",
  "Subscriptions",
])

const PIE_COLORS = [
  "#5b8fd4","#4caf84","#e07070","#f0a070",
  "#9b7dd4","#f5c842","#60b4c8","#e8a0bf","#c8e6c9","#6bcf9e",
]

const fmt = (n) =>
  "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtAxis = (v) => {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
  return v === 0 ? "$0" : `$${v}`
}

// ─── Tooltips ────────────────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "12px 16px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 13, minWidth: 160,
    }}>
      <div style={{ fontWeight: "700", color: "#2d4a3e", marginBottom: 8 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 4 }}>
          <span style={{ color: "#5a6b5a" }}>{p.name}</span>
          <span style={{ fontWeight: "600", color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 13,
    }}>
      <div style={{ fontWeight: "700", color: "#2d4a3e", marginBottom: 4 }}>{d.name}</div>
      <div style={{ fontWeight: "600", color: d.payload.color }}>{fmt(d.value)}</div>
      <div style={{ color: "#5a6b5a", fontSize: 12, marginTop: 2 }}>
        {d.payload.pct.toFixed(1)}% of total
      </div>
    </div>
  )
}

// ─── Cash Flow tab ────────────────────────────────────────────────────────────

function CashFlowTab({ transactions }) {
  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d   = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const txns    = transactions.filter(t => t.date.startsWith(key))
      const income  = txns.filter(t => t.transaction_type === "income").reduce((s, t) => s + parseFloat(t.amount), 0)
      const expenses= txns.filter(t => t.transaction_type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0)
      return { label: MONTH_SHORT[d.getMonth()], income, expenses }
    })
  }, [transactions])

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "24px 20px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 2 }}>Income vs. Expenses</div>
      <div style={{ fontSize: 12, color: "#5a6b5a", marginBottom: 22 }}>Last 12 months</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4} barCategoryGap="32%" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f9f7f2" />
          <XAxis dataKey="label" tick={{ fill: "#5a6b5a", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtAxis} tick={{ fill: "#5a6b5a", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(168,197,232,0.08)" }} />
          <Legend
            wrapperStyle={{ paddingTop: 16, fontSize: 13 }}
            formatter={val => <span style={{ color: "#5a6b5a", fontWeight: "500" }}>{val}</span>}
          />
          <Bar dataKey="income"   name="Income"   fill="#4caf84" radius={[4, 4, 0, 0]} barSize={14} />
          <Bar dataKey="expenses" name="Expenses" fill="#e07070" radius={[4, 4, 0, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Spending tab ─────────────────────────────────────────────────────────────

function SpendingTab({ transactions }) {
  const [activeIndex, setActiveIndex] = useState(null)

  const { pieData, totalExpenses } = useMemo(() => {
    const byCategory = transactions
      .filter(t => t.transaction_type === "expense" && !PARENT_CATS.has(t.category))
      .reduce((acc, t) => {
        const cat = t.category || "Uncategorized"
        acc[cat] = (acc[cat] || 0) + parseFloat(t.amount)
        return acc
      }, {})
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0)
    const sorted = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name, value,
        pct: total > 0 ? (value / total) * 100 : 0,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
    return { pieData: sorted, totalExpenses: total }
  }, [transactions])

  if (pieData.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 14, padding: "48px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center", color: "#a0afc0", fontSize: 14 }}>
        No expense data yet.
      </div>
    )
  }

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 2 }}>Spending by Category</div>
      <div style={{ fontSize: 12, color: "#5a6b5a", marginBottom: 24 }}>
        All time &nbsp;·&nbsp; {pieData.length} categories &nbsp;·&nbsp; {fmt(totalExpenses)} total
      </div>

      <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
        {/* Donut chart */}
        <div style={{ flexShrink: 0 }}>
          <PieChart width={248} height={248}>
            <Pie
              data={pieData}
              cx={119} cy={119}
              innerRadius={70} outerRadius={112}
              dataKey="value"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
              paddingAngle={2}
            >
              {pieData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.3}
                  style={{ transition: "opacity 0.15s", cursor: "default" }}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 10px 8px", marginBottom: 4, borderBottom: "1px solid #f9f7f2" }}>
            <div style={{ flex: 1, fontSize: 11, fontWeight: "600", color: "#a0afc0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</div>
            <div style={{ fontSize: 11, fontWeight: "600", color: "#a0afc0", textTransform: "uppercase", letterSpacing: "0.05em", width: 38, textAlign: "right" }}>%</div>
            <div style={{ fontSize: 11, fontWeight: "600", color: "#a0afc0", textTransform: "uppercase", letterSpacing: "0.05em", width: 88, textAlign: "right" }}>Amount</div>
          </div>

          {pieData.map((entry, i) => (
            <div
              key={entry.name}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "9px 10px", borderRadius: 8, marginBottom: 2,
                background: activeIndex === i ? "#f8faff" : "transparent",
                cursor: "default", transition: "background 0.12s",
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: entry.color, flexShrink: 0,
                boxShadow: activeIndex === i ? `0 0 0 3px ${entry.color}33` : "none",
                transition: "box-shadow 0.12s",
              }} />
              <div style={{
                flex: 1, fontSize: 13,
                fontWeight: activeIndex === i ? "600" : "500",
                color: "#2d4a3e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {entry.name}
              </div>
              <div style={{ fontSize: 12, color: "#a0afc0", width: 38, textAlign: "right", flexShrink: 0 }}>
                {entry.pct.toFixed(1)}%
              </div>
              <div style={{ fontSize: 13, fontWeight: "600", color: "#2d4a3e", width: 88, textAlign: "right", flexShrink: 0 }}>
                {fmt(entry.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Income tab ───────────────────────────────────────────────────────────────

function IncomeTab({ transactions }) {
  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d   = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const income = transactions
        .filter(t => t.date.startsWith(key) && t.transaction_type === "income")
        .reduce((s, t) => s + parseFloat(t.amount), 0)
      return { label: MONTH_SHORT[d.getMonth()], income }
    })
  }, [transactions])

  const { sourceEntries, totalIncome, maxVal } = useMemo(() => {
    const bySource = transactions
      .filter(t => t.transaction_type === "income" && !PARENT_CATS.has(t.category))
      .reduce((acc, t) => {
        const src = t.title || t.category || "Uncategorized"
        acc[src] = (acc[src] || 0) + parseFloat(t.amount)
        return acc
      }, {})
    const total = Object.values(bySource).reduce((s, v) => s + v, 0)
    const entries = Object.entries(bySource)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name, value,
        pct: total > 0 ? (value / total) * 100 : 0,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
    return { sourceEntries: entries, totalIncome: total, maxVal: entries[0]?.value || 1 }
  }, [transactions])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Monthly trend */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 20px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 2 }}>Monthly Income</div>
        <div style={{ fontSize: 12, color: "#5a6b5a", marginBottom: 22 }}>Last 12 months</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData} barCategoryGap="40%" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f9f7f2" />
            <XAxis dataKey="label" tick={{ fill: "#5a6b5a", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtAxis} tick={{ fill: "#5a6b5a", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(76,175,132,0.08)" }} />
            <Bar dataKey="income" name="Income" fill="#4caf84" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income by source */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 2 }}>Income by Source</div>
        <div style={{ fontSize: 12, color: "#5a6b5a", marginBottom: 20 }}>
          All time &nbsp;·&nbsp; {fmt(totalIncome)} total
        </div>

        {sourceEntries.length === 0
          ? <p style={{ color: "#a0afc0", fontSize: 13, margin: 0 }}>No income data yet.</p>
          : sourceEntries.map(e => (
            <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f5f2eb" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
              <div style={{ width: 150, fontSize: 13, fontWeight: "500", color: "#2d4a3e", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.name}
              </div>
              <div style={{ flex: 1, background: "#f9f7f2", borderRadius: 999, height: 6 }}>
                <div style={{ width: `${(e.value / maxVal) * 100}%`, height: "100%", background: e.color, borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 12, color: "#a0afc0", width: 38, textAlign: "right", flexShrink: 0 }}>
                {e.pct.toFixed(0)}%
              </div>
              <div style={{ fontSize: 13, fontWeight: "600", color: "#2d4a3e", width: 88, textAlign: "right", flexShrink: 0 }}>
                {fmt(e.value)}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

// ─── Reports page ─────────────────────────────────────────────────────────────

function Reports({ transactions }) {
  const [activeTab, setActiveTab] = useState("cashflow")

  const totalIncome   = transactions.filter(t => t.transaction_type === "income").reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpenses = transactions.filter(t => t.transaction_type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0)
  const netIncome     = totalIncome - totalExpenses
  const savingsRate   = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0

  const summaryCards = [
    { label: "Total Income",   value: fmt(totalIncome),   color: "#4caf84" },
    { label: "Total Expenses", value: fmt(totalExpenses), color: "#e07070" },
    {
      label: "Net Income",
      value: (netIncome < 0 ? "−" : "+") + fmt(netIncome),
      color: netIncome >= 0 ? "#5b8fd4" : "#e07070",
    },
    {
      label: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      color: savingsRate >= 20 ? "#4caf84" : savingsRate >= 0 ? "#f0a070" : "#e07070",
    },
  ]

  const tabs = [
    { id: "cashflow", label: "Cash Flow" },
    { id: "spending", label: "Spending"  },
    { id: "income",   label: "Income"    },
  ]

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>

      {/* Page header */}
      <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", margin: "0 0 24px" }}>Reports</h1>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {summaryCards.map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: "600", color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: "700", color: c.color, lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Sub-tab strip */}
      <div style={{ display: "flex", background: "#fff", borderRadius: 12, padding: 5, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20, width: "fit-content" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "8px 22px", border: "none", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: "600",
            background: activeTab === tab.id ? "#2d4a3e" : "transparent",
            color: activeTab === tab.id ? "#c8e6c9" : "#5a6b5a",
            transition: "all 0.15s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "cashflow" && <CashFlowTab transactions={transactions} />}
      {activeTab === "spending" && <SpendingTab transactions={transactions} />}
      {activeTab === "income"   && <IncomeTab   transactions={transactions} />}
    </div>
  )
}

export default Reports
