import { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, ReferenceLine, Legend,
} from "recharts"
import { AlertTriangle } from "lucide-react"

// ── Budgets (mirrors Budget.jsx) ──────────────────────────────────────
const CATEGORY_BUDGETS = {
  Housing: 750, Food: 300, Gas: 80,
  Netflix: 15.99, Spotify: 9.99, ChatGPT: 20, "Google One": 2.99,
  Health: 49.99, Entertainment: 80, Dates: 100, Shopping: 100, Transport: 40,
}
const MONTHLY_BUDGET = Object.values(CATEGORY_BUDGETS).reduce((s, v) => s + v, 0)
const WEEKLY_BUDGET  = (MONTHLY_BUDGET * 12) / 52

// ── Formatters ────────────────────────────────────────────────────────
const fmtUSD = (v) =>
  "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = (v) =>
  Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${Math.round(v)}`

// ── Week helpers ──────────────────────────────────────────────────────
function getWeekBounds(weeksAgo, refStr) {
  const ref  = new Date(refStr + "T12:00:00")
  const dow  = ref.getDay()                        // 0 = Sun
  const back = (dow === 0 ? 6 : dow - 1) + weeksAgo * 7
  const mon  = new Date(ref); mon.setDate(ref.getDate() - back)
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6)
  const pad  = (n) => String(n).padStart(2, "0")
  const str  = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const label = mon.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return { start: str(mon), end: str(sun), label }
}

// ── Subscription detection ────────────────────────────────────────────
function detectSubscriptions(transactions) {
  const expenses = transactions.filter(t => t.transaction_type === "expense" && t.title)
  const groups   = {}
  for (const t of expenses) {
    const key = t.title.toLowerCase().trim()
    if (!groups[key]) groups[key] = []
    groups[key].push({ title: t.title, amount: parseFloat(t.amount), month: t.date?.slice(0, 7) })
  }
  const results = []
  for (const txns of Object.values(groups)) {
    const months  = new Set(txns.map(t => t.month).filter(Boolean))
    if (months.size < 2) continue
    const amounts = txns.map(t => t.amount).filter(a => a > 0)
    if (!amounts.length) continue
    const avg    = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const maxDev = Math.max(...amounts.map(a => Math.abs(a - avg) / (avg || 1)))
    if (maxDev > 0.15) continue
    results.push({ title: txns[0].title, monthly: avg, occurrences: months.size })
  }
  return results.sort((a, b) => b.monthly - a.monthly)
}

// ── Forecast computation ──────────────────────────────────────────────
function computeForecast(transactions) {
  const txns = transactions.filter(
    t => t.transaction_type === "expense" && t.date?.startsWith("2026-04")
  )
  if (!txns.length) return null

  const latestDay  = txns.reduce((m, t) => Math.max(m, parseInt(t.date.slice(8))), 1)
  const daysInMonth = 30
  const progress   = latestDay / daysInMonth

  const spent = {}
  for (const t of txns) {
    if (t.category) spent[t.category] = (spent[t.category] || 0) + parseFloat(t.amount)
  }

  const rows = Object.entries(CATEGORY_BUDGETS)
    .map(([cat, budget]) => {
      const s   = spent[cat] || 0
      const proj = progress > 0 ? s / progress : s
      const status =
        proj > budget        ? "Over Budget" :
        proj > budget * 0.80 ? "Warning"     : "On Track"
      return { cat, spent: s, projected: Math.round(proj * 100) / 100, budget, status }
    })
    .filter(r => r.spent > 0)

  return { rows, progress, latestDay, daysInMonth }
}

// ── Tooltip components ────────────────────────────────────────────────
function PulseTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 12 }}>
      <div style={{ fontWeight: "700", color: "#2d4a3e", marginBottom: 4 }}>Week of {label}</div>
      <div style={{ color: payload[0]?.fill, fontWeight: "700", fontSize: 14 }}>
        {fmtUSD(payload[0]?.value ?? 0)}
      </div>
    </div>
  )
}

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 12 }}>
      <div style={{ fontWeight: "700", color: "#2d4a3e", marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 3 }}>
          <span style={{ color: "#5a6b5a" }}>{p.name}</span>
          <span style={{ fontWeight: "600", color: p.fill }}>{fmtUSD(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// Tab 1 — Spending Pulse
// ════════════════════════════════════════════════════════════════════
function SpendingPulse({ transactions }) {
  const expenses = useMemo(
    () => transactions.filter(t => t.transaction_type === "expense"),
    [transactions]
  )

  const refDate = useMemo(() => {
    if (!expenses.length) return new Date().toISOString().slice(0, 10)
    return expenses.reduce((max, t) => (t.date > max ? t.date : max), "")
  }, [expenses])

  const weeks = useMemo(
    () =>
      [3, 2, 1, 0].map(ago => {
        const { start, end, label } = getWeekBounds(ago, refDate)
        const total = expenses
          .filter(t => t.date >= start && t.date <= end)
          .reduce((s, t) => s + parseFloat(t.amount), 0)
        return { label, total, start, end }
      }),
    [expenses, refDate]
  )

  const cur       = weeks[3]
  const prior     = weeks[2]
  const pctChange = prior.total > 0 ? ((cur.total - prior.total) / prior.total) * 100 : 0
  const isOver    = cur.total > WEEKLY_BUDGET
  const isTrend   = pctChange > 20 && prior.total > 0

  const barFill = (v) => {
    const r = v / WEEKLY_BUDGET
    if (r > 1)   return "#e07070"
    if (r > 0.8) return "#f0a070"
    return "#4caf84"
  }

  const chartData = weeks.map(w => ({ label: w.label, spent: Math.round(w.total * 100) / 100 }))

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { title: "This Week",     value: fmtUSD(cur.total),        sub: `${cur.start} – ${cur.end}`,   color: isOver ? "#e07070" : "#2d4a3e" },
          { title: "Last Week",     value: fmtUSD(prior.total),      sub: `${prior.start} – ${prior.end}`, color: "#2d4a3e" },
          { title: "Weekly Budget", value: fmtUSD(WEEKLY_BUDGET),    sub: "Based on monthly plan",        color: "#2d4a3e" },
        ].map(c => (
          <div key={c.title} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: "600", color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {c.title}
            </div>
            <div style={{ fontSize: 24, fontWeight: "700", color: c.color, lineHeight: 1, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#a0afc0" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {(isOver || isTrend) && (
        <div style={{
          background: "#fff8f0", border: "1px solid #f0c4a0", borderRadius: 12,
          padding: "14px 18px", marginBottom: 20,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <AlertTriangle size={18} color="#f0a070" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: "700", color: "#2d4a3e" }}>
              {isOver ? "Over weekly budget" : "Spending trending up"}
            </div>
            <div style={{ fontSize: 12, color: "#5a6b5a", marginTop: 2 }}>
              {isOver
                ? `You've spent ${fmtUSD(cur.total - WEEKLY_BUDGET)} over your ${fmtUSD(WEEKLY_BUDGET)} weekly limit.`
                : `This week is up ${pctChange.toFixed(0)}% vs. last week (${fmtUSD(prior.total)} → ${fmtUSD(cur.total)}).`}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 20px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e" }}>Last 4 Weeks — Spending</div>
          {prior.total > 0 && (
            <span style={{ fontSize: 12, fontWeight: "600", color: pctChange > 0 ? "#e07070" : "#4caf84" }}>
              {pctChange > 0 ? "+" : ""}{pctChange.toFixed(0)}% vs prior week
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#a0afc0", marginBottom: 16 }}>
          Weekly budget: {fmtUSD(WEEKLY_BUDGET)}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f9f7f2" />
            <XAxis dataKey="label" tick={{ fill: "#5a6b5a", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: "#5a6b5a", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<PulseTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <ReferenceLine
              y={WEEKLY_BUDGET} stroke="#f0a070" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: "Budget", position: "insideTopRight", fill: "#f0a070", fontSize: 11 }}
            />
            <Bar dataKey="spent" name="Spent" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={barFill(entry.spent)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// Tab 2 — Subscription Tracker
// ════════════════════════════════════════════════════════════════════
function SubscriptionTracker({ transactions }) {
  const subs = useMemo(() => detectSubscriptions(transactions), [transactions])
  const [cancelled, setCancelled] = useState(new Set())

  const total        = subs.reduce((s, sub) => s + sub.monthly, 0)
  const activeSubs   = subs.filter(s => !cancelled.has(s.title))
  const activeTotal  = activeSubs.reduce((s, sub) => s + sub.monthly, 0)
  const savedMonthly = total - activeTotal

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Detected",      value: String(subs.length),      color: "#2d4a3e" },
          { label: "Monthly Cost",  value: fmtUSD(activeTotal),      color: "#e07070" },
          { label: "Annual Cost",   value: fmtUSD(activeTotal * 12), color: "#2d4a3e" },
          { label: "Saved So Far",  value: fmtUSD(savedMonthly) + "/mo", color: "#4caf84" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: "600", color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: "700", color: c.color, lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {subs.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: "52px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 15, fontWeight: "600", color: "#2d4a3e", marginBottom: 6 }}>
            No subscriptions detected yet
          </div>
          <div style={{ fontSize: 13, color: "#a0afc0" }}>
            Recurring charges are detected after 2+ months of the same merchant with a consistent amount.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {subs.map(sub => {
            const isCancelled = cancelled.has(sub.title)
            const initials    = sub.title.trim().slice(0, 2).toUpperCase()
            return (
              <div
                key={sub.title}
                style={{
                  background: "#fff", borderRadius: 14, padding: "16px 20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                  opacity: isCancelled ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: "#f9f7f2",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: "700", color: "#2d4a3e" }}>{initials}</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e" }}>{sub.title}</span>
                      {isCancelled && (
                        <span style={{ fontSize: 10, fontWeight: "700", color: "#4caf84", background: "#4caf8420", borderRadius: 20, padding: "2px 8px" }}>
                          CANCELLED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#a0afc0", marginTop: 2 }}>
                      Detected across {sub.occurrences} months
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: "700", color: isCancelled ? "#a0afc0" : "#2d4a3e" }}>
                      {fmtUSD(sub.monthly)}
                    </div>
                    <div style={{ fontSize: 11, color: "#a0afc0" }}>/ month</div>
                  </div>
                  {!isCancelled ? (
                    <button
                      onClick={() => setCancelled(prev => new Set([...prev, sub.title]))}
                      style={{
                        padding: "9px 16px", borderRadius: 8, border: "none",
                        background: "#e07070", color: "#fff",
                        fontSize: 12, fontWeight: "700", cursor: "pointer",
                        whiteSpace: "nowrap", fontFamily: "inherit",
                      }}
                    >
                      Cancel &amp; Save {fmtUSD(sub.monthly)}/mo
                    </button>
                  ) : (
                    <button
                      onClick={() => setCancelled(prev => { const n = new Set(prev); n.delete(sub.title); return n })}
                      style={{
                        padding: "9px 16px", borderRadius: 8, border: "1px solid #e8eef4",
                        background: "#fff", color: "#5a6b5a",
                        fontSize: 12, fontWeight: "600", cursor: "pointer",
                        whiteSpace: "nowrap", fontFamily: "inherit",
                      }}
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// Tab 3 — Spending Forecast
// ════════════════════════════════════════════════════════════════════
const STATUS_COLOR = { "Over Budget": "#e07070", Warning: "#f0a070", "On Track": "#4caf84" }
const STATUS_BG    = { "Over Budget": "#e0707018", Warning: "#f0a07018", "On Track": "#4caf8418" }
const STATUS_ORDER = { "Over Budget": 0, Warning: 1, "On Track": 2 }

function SpendingForecast({ transactions }) {
  const forecast = useMemo(() => computeForecast(transactions), [transactions])

  if (!forecast) {
    return (
      <div style={{ background: "#fff", borderRadius: 14, padding: "52px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: "600", color: "#2d4a3e", marginBottom: 6 }}>No April 2026 data</div>
        <div style={{ fontSize: 13, color: "#a0afc0" }}>Forecast requires expense transactions for the current month.</div>
      </div>
    )
  }

  const { rows, progress, latestDay, daysInMonth } = forecast
  const totalSpent     = rows.reduce((s, r) => s + r.spent, 0)
  const totalProjected = rows.reduce((s, r) => s + r.projected, 0)
  const totalBudget    = rows.reduce((s, r) => s + r.budget, 0)

  const chartData = rows.map(r => ({
    cat: r.cat.length > 9 ? r.cat.slice(0, 8) + "." : r.cat,
    Budget: r.budget,
    Projected: r.projected,
  }))

  const sortedRows = [...rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Days Elapsed",    value: `${latestDay} / ${daysInMonth}`,          color: "#5b8fd4" },
          { label: "Month Progress",  value: `${Math.round(progress * 100)}%`,          color: "#c8e6c9" },
          { label: "Spent So Far",    value: fmtUSD(totalSpent),                        color: "#f0a070" },
          { label: "Projected Total", value: fmtUSD(totalProjected),                    color: totalProjected > totalBudget ? "#e07070" : "#4caf84" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: "600", color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: "700", color: c.color, lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 20px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 2 }}>
          Projected vs Budget — by Category
        </div>
        <div style={{ fontSize: 11, color: "#a0afc0", marginBottom: 16 }}>
          Based on {Math.round(progress * 100)}% of April elapsed · projecting to end of month
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barGap={3} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#f9f7f2" />
            <XAxis dataKey="cat" tick={{ fill: "#5a6b5a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: "#5a6b5a", fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<ForecastTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend
              wrapperStyle={{ paddingTop: 14, fontSize: 12 }}
              formatter={(v) => <span style={{ color: "#5a6b5a", fontWeight: "500" }}>{v}</span>}
            />
            <Bar dataKey="Budget"    fill="#5b8fd4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Projected" fill="#f0a070" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f9f7f2" }}>
          <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e" }}>Category Breakdown</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Category", "Spent So Far", "Projected Total", "Budget", "Status"].map((h, i) => (
                  <th key={h} style={{
                    padding: "9px 22px",
                    textAlign: i === 0 ? "left" : "right",
                    fontSize: 11, fontWeight: "600", color: "#5a6b5a",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    background: "#fafcff", borderBottom: "1px solid #f9f7f2",
                    whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr
                  key={row.cat}
                  style={{ borderBottom: idx < sortedRows.length - 1 ? "1px solid #f5f2eb" : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafcff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "12px 22px", fontWeight: "600", color: "#2d4a3e" }}>{row.cat}</td>
                  <td style={{ padding: "12px 22px", textAlign: "right", color: "#5a6b5a" }}>{fmtUSD(row.spent)}</td>
                  <td style={{ padding: "12px 22px", textAlign: "right", fontWeight: "600", color: "#2d4a3e" }}>{fmtUSD(row.projected)}</td>
                  <td style={{ padding: "12px 22px", textAlign: "right", color: "#5a6b5a" }}>{fmtUSD(row.budget)}</td>
                  <td style={{ padding: "12px 22px", textAlign: "right" }}>
                    <span style={{
                      display: "inline-block",
                      background: STATUS_BG[row.status],
                      color: STATUS_COLOR[row.status],
                      borderRadius: 20, padding: "3px 11px",
                      fontSize: 11, fontWeight: "700",
                    }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// Main component
// ════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "pulse",    label: "Spending Pulse"       },
  { id: "subs",     label: "Subscription Tracker" },
  { id: "forecast", label: "Spending Forecast"    },
]

function Insights({ transactions }) {
  const [tab, setTab] = useState("pulse")

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>
      <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", margin: "0 0 4px" }}>Insights</h1>
      <p style={{ fontSize: 14, color: "#5a6b5a", margin: "0 0 24px" }}>
        Intelligent analysis of your spending patterns and financial trends.
      </p>

      {/* Tab bar */}
      <div style={{
        display: "flex", background: "#fff", borderRadius: 10, padding: 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", gap: 2, marginBottom: 24, width: "fit-content",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "7px 20px", borderRadius: 7, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: "600", fontFamily: "inherit",
            background: tab === t.id ? "#2d4a3e" : "transparent",
            color: tab === t.id ? "#c8e6c9" : "#5a6b5a",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pulse"    && <SpendingPulse        transactions={transactions} />}
      {tab === "subs"     && <SubscriptionTracker  transactions={transactions} />}
      {tab === "forecast" && <SpendingForecast     transactions={transactions} />}
    </div>
  )
}

export default Insights
