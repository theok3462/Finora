import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, TrendingUp, TrendingDown, CreditCard, Check } from "lucide-react"
import { recurringPayments } from "../data"

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

const fmt = (n) =>
  "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TYPE_CONFIG = {
  income:  { label: "Income",       color: "#4caf84", bg: "#edf7f2", Icon: TrendingUp   },
  expense: { label: "Expenses",     color: "#e07070", bg: "#fdf0f0", Icon: TrendingDown },
  credit:  { label: "Credit Cards", color: "#f0a070", bg: "#fef5ed", Icon: CreditCard   },
}

// Decide if an item counts as paid given the viewed month vs today
function resolvesPaid(item, viewYear, viewMonth) {
  const todayYear  = TODAY.getFullYear()
  const todayMonth = TODAY.getMonth()
  if (viewYear < todayYear || (viewYear === todayYear && viewMonth < todayMonth)) return true  // past month
  if (viewYear > todayYear || (viewYear === todayYear && viewMonth > todayMonth)) return false // future month
  return item.paid // current month — use real value
}

function dueDate(item, year, month) {
  return new Date(year, month, item.dueDay)
}

function daysFromToday(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - TODAY) / 86400000)
}

// For the "All" tab: next occurrence from today
function nextOccurrence(item) {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), item.dueDay)
  if (d < TODAY) d.setMonth(d.getMonth() + 1)
  return d
}

function dateLabel(days) {
  if (days === 0) return "Due today"
  if (days < 0)  return `${Math.abs(days)}d overdue`
  return `in ${days}d`
}

function dateColor(days, paid) {
  if (paid)       return "#4caf84"
  if (days < 0)   return "#e07070"
  if (days === 0) return "#f0a070"
  if (days <= 3)  return "#f0a070"
  return "#5a6b5a"
}

// ─── Merchant avatar ──────────────────────────────────────────────────────────

function Avatar({ name, type }) {
  const cfg = TYPE_CONFIG[type]
  const initials = name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: "700", color: cfg.color,
    }}>
      {initials}
    </div>
  )
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ type, items }) {
  const cfg  = TYPE_CONFIG[type]
  const Icon = cfg.Icon
  const total     = items.reduce((s, i) => s + i.amount, 0)
  const paidAmt   = items.filter(i => i._paid).reduce((s, i) => s + i.amount, 0)
  const remaining = total - paidAmt
  const paidCount = items.filter(i => i._paid).length
  const pct       = total > 0 ? (paidAmt / total) * 100 : 0
  const verb      = type === "income" ? "received" : "paid"

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={cfg.color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: "700", color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {cfg.label}
        </span>
      </div>

      {/* Total */}
      <div style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", marginBottom: 12 }}>
        {fmt(total)}
      </div>

      {/* Progress bar */}
      <div style={{ background: "#f9f7f2", borderRadius: 999, height: 4, marginBottom: 10, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cfg.color, borderRadius: 999 }} />
      </div>

      {/* Received / remaining */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12 }}>
          <span style={{ fontWeight: "600", color: cfg.color }}>{fmt(paidAmt)}</span>
          <span style={{ color: "#a0afc0" }}> {verb}</span>
        </div>
        <div style={{ fontSize: 12 }}>
          <span style={{ fontWeight: "600", color: "#2d4a3e" }}>{fmt(remaining)}</span>
          <span style={{ color: "#a0afc0" }}> left</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#a0afc0", marginTop: 5 }}>
        {paidCount} of {items.length} {verb}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function Recurring() {
  const [tab,        setTab]        = useState("monthly")
  const [viewYear,   setViewYear]   = useState(TODAY.getFullYear())
  const [viewMonth,  setViewMonth]  = useState(TODAY.getMonth())

  const isCurrentMonth = viewYear === TODAY.getFullYear() && viewMonth === TODAY.getMonth()

  const navigate = (dir) => {
    let m = viewMonth + dir, y = viewYear
    if (m < 0)  { m = 11; y-- }
    if (m > 11) { m = 0;  y++ }
    setViewMonth(m); setViewYear(y)
  }

  // Enrich items with resolved paid status and computed date
  const enriched = useMemo(() => {
    return recurringPayments.map(item => {
      const _paid = resolvesPaid(item, viewYear, viewMonth)
      const date  = tab === "all"
        ? nextOccurrence(item)
        : dueDate(item, viewYear, viewMonth)
      const days = tab === "all" || isCurrentMonth
        ? daysFromToday(date)
        : null
      return { ...item, _paid, _date: date, _days: days }
    })
  }, [viewYear, viewMonth, tab, isCurrentMonth])

  // Tab filtering: Monthly shows items scoped to the selected month; All shows every entry
  const visible = useMemo(() => {
    return [...enriched].sort((a, b) => a.dueDay - b.dueDay)
  }, [enriched])

  const incomeItems  = visible.filter(i => i.type === "income")
  const expenseItems = visible.filter(i => i.type === "expense")
  const creditItems  = visible.filter(i => i.type === "credit")

  const totalIncome   = incomeItems.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenseItems.reduce((s, i) => s + i.amount, 0)
  const totalCredit   = creditItems.reduce((s, i)  => s + i.amount, 0)
  const net           = totalIncome - totalExpenses - totalCredit

  // Month label
  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`

  // Date string helper for a row
  const rowDateStr = (item) => {
    const mo = MONTH_NAMES[item._date.getMonth()].slice(0, 3)
    return `${mo} ${item._date.getDate()}`
  }

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", margin: 0 }}>Recurring</h1>
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 10,
          background: "#2d4a3e", color: "#c8e6c9",
          border: "none", cursor: "pointer", fontSize: 13, fontWeight: "600",
        }}>
          <Plus size={15} /> Add Recurring
        </button>
      </div>

      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "#fff", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d4a3e", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{ fontSize: 16, fontWeight: "700", color: "#2d4a3e", minWidth: 160, textAlign: "center" }}>
          {monthLabel}
        </div>

        {!isCurrentMonth && (
          <button
            onClick={() => { setViewYear(TODAY.getFullYear()); setViewMonth(TODAY.getMonth()) }}
            style={{ background: "#2d4a3e", color: "#c8e6c9", border: "none", borderRadius: 8, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: "600" }}
          >
            Today
          </button>
        )}

        <button
          onClick={() => navigate(1)}
          style={{ background: "#fff", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d4a3e", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <SummaryCard type="income"  items={incomeItems}  />
        <SummaryCard type="expense" items={expenseItems} />
        <SummaryCard type="credit"  items={creditItems}  />
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", background: "#fff", borderRadius: 12, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16, width: "fit-content" }}>
        {[{ id: "monthly", label: "Monthly" }, { id: "all", label: "All" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "7px 20px", border: "none", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: "600",
            background: tab === t.id ? "#2d4a3e" : "transparent",
            color: tab === t.id ? "#c8e6c9" : "#5a6b5a",
            transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>

        {/* Section label */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f9f7f2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e" }}>
            Upcoming &nbsp;
            <span style={{ fontSize: 12, fontWeight: "500", color: "#a0afc0" }}>
              {visible.length} payment{visible.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#a0afc0" }}>
            {tab === "monthly" ? monthLabel : "All recurring"}
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 160px 140px 110px",
          padding: "10px 20px", borderBottom: "1px solid #f9f7f2",
          fontSize: 11, fontWeight: "600", color: "#a0afc0",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          <div>Merchant / Frequency</div>
          <div>Due Date</div>
          <div>Category</div>
          <div style={{ textAlign: "right" }}>Amount</div>
        </div>

        {/* Rows */}
        {visible.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "#a0afc0", fontSize: 14 }}>
            No recurring payments for this period.
          </div>
        )}

        {visible.map((item, i) => {
          const cfg   = TYPE_CONFIG[item.type]
          const dStr  = rowDateStr(item)
          const dLbl  = item._days !== null ? dateLabel(item._days) : dStr
          const dClr  = item._days !== null ? dateColor(item._days, item._paid) : "#5a6b5a"
          const isLast = i === visible.length - 1

          return (
            <div
              key={item.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 160px 140px 110px",
                padding: "13px 20px", alignItems: "center",
                borderBottom: isLast ? "none" : "1px solid #f5f2eb",
                opacity: item._paid ? 0.55 : 1,
                transition: "background 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafcff"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {/* Merchant + frequency */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={item.name} type={item.type} />
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: "600", color: "#2d4a3e",
                    textDecoration: item._paid ? "line-through" : "none",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {item.name}
                    {item._paid && <Check size={13} color="#4caf84" />}
                  </div>
                  <div style={{ fontSize: 11, color: "#a0afc0", marginTop: 2 }}>{item.frequency}</div>
                </div>
              </div>

              {/* Due date + days label */}
              <div>
                <div style={{ fontSize: 13, fontWeight: "600", color: "#2d4a3e" }}>{dStr}</div>
                <div style={{ fontSize: 11, fontWeight: "500", color: dClr, marginTop: 2 }}>{dLbl}</div>
              </div>

              {/* Category badge */}
              <div>
                <span style={{
                  fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em",
                  padding: "3px 9px", borderRadius: 20,
                  background: cfg.bg, color: cfg.color,
                }}>
                  {item.category}
                </span>
              </div>

              {/* Amount */}
              <div style={{
                fontSize: 14, fontWeight: "700", textAlign: "right",
                color: item.type === "income" ? "#4caf84" : "#e07070",
              }}>
                {item.type === "income" ? "+" : "−"}{fmt(item.amount)}
              </div>
            </div>
          )
        })}

        {/* Footer totals bar */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 160px 140px 110px",
          padding: "14px 20px",
          borderTop: "2px solid #f9f7f2",
          background: "#f5f2eb",
        }}>
          {/* Left: income / expenses / credit breakdown */}
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {[
              { label: "Income",   value: totalIncome,   color: "#4caf84", sign: "+" },
              { label: "Expenses", value: totalExpenses, color: "#e07070", sign: "−" },
              { label: "Credit",   value: totalCredit,   color: "#f0a070", sign: "−" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 10, fontWeight: "600", color: "#a0afc0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: "700", color: s.color }}>
                  {s.sign}{fmt(s.value)}
                </div>
              </div>
            ))}
          </div>

          {/* Spacer columns */}
          <div /><div />

          {/* Net */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: "600", color: "#a0afc0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Net
            </div>
            <div style={{ fontSize: 14, fontWeight: "700", color: net >= 0 ? "#4caf84" : "#e07070" }}>
              {net >= 0 ? "+" : "−"}{fmt(net)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Recurring
