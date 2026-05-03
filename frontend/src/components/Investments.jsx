import { useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts"
import { holdings } from "../data"

function buildChartData() {
  let seed = 0xDEADBEEF
  const rng = () => {
    seed = (seed ^ (seed << 13)) >>> 0
    seed = (seed ^ (seed >> 17)) >>> 0
    seed = (seed ^ (seed << 5)) >>> 0
    return seed / 0xFFFFFFFF
  }
  const days = 89
  const portDrift = Math.log(82.17 / 100) / days
  const spDrift   = Math.log(103.62 / 100) / days
  let port = 100, sp = 100
  const start = new Date(2026, 1, 1)
  return Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    if (i > 0) {
      const u1 = Math.max(rng(), 1e-9), u2 = rng()
      const u3 = Math.max(rng(), 1e-9), u4 = rng()
      const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const z2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4)
      port *= Math.exp(portDrift + 0.014 * z1)
      sp   *= Math.exp(spDrift   + 0.008 * z2)
    }
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      portfolio: +port.toFixed(2),
      sp500: +sp.toFixed(2),
      showLabel: d.getDate() === 1,
    }
  })
}
const CHART_DATA = buildChartData()

const PERF_CARDS = [
  { label: "Your Portfolio", mo3: -17.83, today: +1.16 },
  { label: "S&P 500",        mo3: +3.62,  today: +0.28 },
  { label: "US Stocks",      mo3: +3.74,  today: +0.31 },
  { label: "US Bonds",       mo3: -0.79,  today: -0.20 },
]

const fmtUSD = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%"
const pctColor = (n) => (n >= 0 ? "#4caf84" : "#e07070")

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 12,
    }}>
      <div style={{ fontWeight: "700", color: "#2d4a3e", marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 3 }}>
          <span style={{ color: p.color, fontWeight: "600" }}>{p.name}</span>
          <span style={{ color: "#2d4a3e" }}>
            {p.value >= 100 ? "+" : ""}{(p.value - 100).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function Investments() {
  const [tab, setTab] = useState("holdings")
  const totalValue = holdings.reduce((s, h) => s + h.price * h.quantity, 0)

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>
      <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", margin: "0 0 4px" }}>Investments</h1>
      <p style={{ fontSize: 14, color: "#5a6b5a", margin: "0 0 24px" }}>
        Track your portfolio performance and holdings.
      </p>

      {/* Tabs */}
      <div style={{
        display: "flex", background: "#fff", borderRadius: 10, padding: 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", gap: 2, marginBottom: 24, width: "fit-content",
      }}>
        {["holdings", "advanced"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 22px", borderRadius: 7, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: "600",
            background: tab === t ? "#2d4a3e" : "transparent",
            color: tab === t ? "#c8e6c9" : "#5a6b5a",
            transition: "all 0.15s",
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "holdings" ? (
        <>
          {/* Performance Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
            {PERF_CARDS.map(c => (
              <div key={c.label} style={{
                background: "#fff", borderRadius: 14, padding: "20px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: "600", color: "#5a6b5a",
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12,
                }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: "700", color: pctColor(c.mo3), lineHeight: 1, marginBottom: 6 }}>
                  {fmtPct(c.mo3)}
                </div>
                <div style={{ fontSize: 11, color: "#a0afc0", marginBottom: 10 }}>Past 3 Months</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: "600", color: pctColor(c.today) }}>
                    {fmtPct(c.today)}
                  </span>
                  <span style={{ fontSize: 12, color: "#a0afc0" }}>today</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: "24px 20px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20,
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: "700", color: "#2d4a3e" }}>
                Portfolio vs. Benchmarks
              </div>
              <div style={{ fontSize: 12, color: "#a0afc0", marginTop: 2 }}>
                Indexed to 100 · Past 3 Months
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f0a070" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f0a070" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#5b8fd4" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#5b8fd4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f9f7f2" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#5a6b5a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(val, idx) => CHART_DATA[idx]?.showLabel ? val : ""}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#5a6b5a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tickFormatter={(v) => v.toFixed(0)}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e0e8f0", strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="portfolio" name="Portfolio"
                  stroke="#f0a070" strokeWidth={2.5}
                  fill="url(#portGrad)" dot={false}
                  activeDot={{ r: 4, fill: "#f0a070", strokeWidth: 0 }}
                />
                <Area
                  type="monotone" dataKey="sp500" name="S&P 500"
                  stroke="#5b8fd4" strokeWidth={2.5}
                  fill="url(#spGrad)" dot={false}
                  activeDot={{ r: 4, fill: "#5b8fd4", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 8 }}>
              {[{ color: "#f0a070", label: "Portfolio" }, { color: "#5b8fd4", label: "S&P 500" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5a6b5a" }}>
                  <div style={{ width: 22, height: 2.5, background: l.color, borderRadius: 2 }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Holdings Table */}
          <div style={{
            background: "#fff", borderRadius: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f9f7f2" }}>
              <div style={{ fontSize: 15, fontWeight: "700", color: "#2d4a3e" }}>Holdings</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Ticker", "Name", "Price", "Quantity", "Value", "Weight %", "Past 3 Months"].map(col => (
                      <th key={col} style={{
                        padding: "10px 24px",
                        textAlign: col === "Ticker" || col === "Name" ? "left" : "right",
                        fontSize: 11, fontWeight: "600", color: "#5a6b5a",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        background: "#fafcff", borderBottom: "1px solid #f9f7f2",
                        whiteSpace: "nowrap",
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, idx) => {
                    const value = h.price * h.quantity
                    const weight = (value / totalValue) * 100
                    return (
                      <tr
                        key={h.ticker}
                        style={{ borderBottom: idx < holdings.length - 1 ? "1px solid #f5f2eb" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fafcff"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "14px 24px" }}>
                          <span style={{ fontWeight: "700", color: "#2d4a3e" }}>{h.ticker}</span>
                        </td>
                        <td style={{ padding: "14px 24px", color: "#5a6b5a" }}>{h.name}</td>
                        <td style={{ padding: "14px 24px", textAlign: "right", color: "#2d4a3e", fontWeight: "500" }}>
                          {fmtUSD(h.price)}
                        </td>
                        <td style={{ padding: "14px 24px", textAlign: "right", color: "#2d4a3e" }}>
                          {h.quantity}
                        </td>
                        <td style={{ padding: "14px 24px", textAlign: "right", fontWeight: "600", color: "#2d4a3e" }}>
                          {fmtUSD(value)}
                        </td>
                        <td style={{ padding: "14px 24px", textAlign: "right", color: "#5a6b5a" }}>
                          {weight.toFixed(1)}%
                        </td>
                        <td style={{ padding: "14px 24px", textAlign: "right" }}>
                          <span style={{
                            display: "inline-block",
                            background: h.past3mo >= 0 ? "#4caf8420" : "#e0707020",
                            color: pctColor(h.past3mo),
                            borderRadius: 20,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: "700",
                          }}>
                            {fmtPct(h.past3mo)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{
              padding: "14px 24px", borderTop: "1px solid #f9f7f2",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#fafcff",
            }}>
              <span style={{ fontSize: 13, fontWeight: "600", color: "#2d4a3e" }}>Total Portfolio</span>
              <span style={{ fontSize: 15, fontWeight: "700", color: "#2d4a3e" }}>{fmtUSD(totalValue)}</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{
          background: "#fff", borderRadius: 14, padding: "56px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center",
        }}>
          <div style={{ fontSize: 15, fontWeight: "600", color: "#2d4a3e", marginBottom: 6 }}>
            Advanced Analytics
          </div>
          <div style={{ fontSize: 13, color: "#a0afc0" }}>
            Coming soon — risk metrics, alpha/beta, drawdown analysis, and more.
          </div>
        </div>
      )}
    </div>
  )
}

export default Investments
