import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts"

// --- Projection model ---
const BASE_VALUE    = 17918
const PMT           = 800
const MONTHLY_RATE  = 0.07 / 12
const START_YEAR    = 2026
const BIRTH_YEAR    = 2001   // assumed (age 25 in 2026)
const LIQUID_SAVINGS = 16421.50  // checking + savings

function projectValue(months) {
  if (months === 0) return BASE_VALUE
  const g = Math.pow(1 + MONTHLY_RATE, months)
  return Math.round(BASE_VALUE * g + PMT * (g - 1) / MONTHLY_RATE)
}

const PROJECTION = Array.from({ length: 25 }, (_, i) => ({
  year: START_YEAR + i,
  value: projectValue(i * 12),
}))

const LIFE_EVENTS = [
  { year: 2029, label: "Buy a Home",     above: true,  detail: "A projected down payment of $70K is within reach." },
  { year: 2032, label: "Start a Family", above: false, detail: "Budget for added expenses — childcare, space, insurance." },
  { year: 2038, label: "Career Peak",    above: true,  detail: "Prime earning years can significantly accelerate growth." },
  { year: 2045, label: "Pay Off Home",   above: false, detail: "Eliminating your mortgage frees up ~$2,400/mo." },
  { year: 2049, label: "Retire",         above: true,  detail: "Financial independence — live off investment returns." },
]

const fmtK = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}
const fmtUSD = (v) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { year, value } = payload[0].payload
  const event = LIFE_EVENTS.find(e => e.year === year)
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 12, minWidth: 140,
    }}>
      <div style={{ fontWeight: "700", color: "#2d4a3e", marginBottom: 4 }}>{year}</div>
      {event && (
        <div style={{ fontSize: 11, color: "#f0a070", fontWeight: "600", marginBottom: 4 }}>{event.label}</div>
      )}
      <div style={{ color: "#f0a070", fontWeight: "700", fontSize: 15 }}>{fmtUSD(value)}</div>
    </div>
  )
}

function Forecasting() {
  const [retireAge, setRetireAge]       = useState(65)
  const [homePrice, setHomePrice]       = useState(350000)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const retireYear         = BIRTH_YEAR + retireAge
  const retireMonths       = Math.max(0, (retireYear - START_YEAR) * 12)
  const retireNetWorth     = projectValue(retireMonths)
  const retireMonthlyIncome = Math.round(retireNetWorth * 0.04 / 12)

  const downPayment  = Math.round(homePrice * 0.2)
  const savingsGap   = Math.max(0, downPayment - LIQUID_SAVINGS)
  const monthsToSave = savingsGap > 0 ? Math.ceil(savingsGap / PMT) : 0

  const milestones = [
    { label: "5 Years  (2031)", value: projectValue(60)  },
    { label: "10 Years (2036)", value: projectValue(120) },
    { label: "20 Years (2046)", value: projectValue(240) },
  ]

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f1e18 0%, #2d4a3e 45%, #1f3328 100%)",
        borderRadius: 16,
        padding: "52px 48px 44px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(240,160,112,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, right: 140, width: 160, height: 160, borderRadius: "50%", background: "rgba(91,143,212,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 28, right: 90, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 48, fontWeight: "800", color: "#fff", lineHeight: 1.15, marginBottom: 14 }}>
            See how your{" "}
            <em style={{ fontStyle: "italic", color: "#f0a070" }}>future</em>
            {" "}plays out
          </div>
          <div style={{ fontSize: 15, color: "#6b8a7a", maxWidth: 500, lineHeight: 1.6 }}>
            Your net worth projected to 2050 based on $800/mo savings at a 7% annual return.
          </div>

          <div style={{ display: "flex", gap: 44, marginTop: 32, flexWrap: "wrap" }}>
            {[
              { value: fmtUSD(BASE_VALUE),          label: "Net Worth Today",   color: "#f0a070" },
              { value: "$800/mo",                   label: "Monthly Savings",   color: "#4caf84" },
              { value: "7% avg",                    label: "Annual Return",     color: "#c8e6c9" },
              { value: fmtUSD(projectValue(288)),   label: "Projected by 2050", color: "#9b7dd4" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 22, fontWeight: "700", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#6b8a7a", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: "24px 20px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20,
      }}>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: "700", color: "#2d4a3e" }}>Net Worth Projection</div>
          <div style={{ fontSize: 12, color: "#a0afc0", marginTop: 2 }}>
            2026 – 2050 · Click a life event marker to explore
          </div>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={PROJECTION} margin={{ top: 44, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f9f7f2" />
            <XAxis
              dataKey="year"
              ticks={[2026, 2030, 2035, 2040, 2045, 2050]}
              tick={{ fill: "#5a6b5a", fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => String(v)}
            />
            <YAxis
              tickFormatter={fmtK}
              tick={{ fill: "#5a6b5a", fontSize: 11 }}
              axisLine={false} tickLine={false}
              width={52}
              domain={[0, "auto"]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e0e8f0", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f0a070"
              strokeWidth={2.5}
              strokeDasharray="8 4"
              activeDot={{ r: 5, fill: "#f0a070", stroke: "#fff", strokeWidth: 2 }}
              dot={(props) => {
                const { cx, cy, payload } = props
                const event = LIFE_EVENTS.find(e => e.year === payload.year)
                if (!event) return <circle cx={cx} cy={cy} r={0} fill="none" />

                const isSelected = selectedEvent?.year === event.year
                const yOff = event.above ? -26 : 26
                const W = 110, H = 19

                return (
                  <g
                    onClick={() => setSelectedEvent(isSelected ? null : event)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={cx} cy={cy} r={14} fill="#f0a070" opacity={isSelected ? 0.22 : 0.10} />
                    <circle cx={cx} cy={cy} r={7}  fill={isSelected ? "#f0a070" : "#fff"} stroke="#f0a070" strokeWidth={2.5} />
                    <circle cx={cx} cy={cy} r={3}  fill="#f0a070" opacity={isSelected ? 0 : 1} />
                    <rect
                      x={cx - W / 2} y={cy + yOff - H / 2}
                      width={W} height={H} rx={10}
                      fill={isSelected ? "#f0a070" : "#2d4a3e"}
                    />
                    <text
                      x={cx} y={cy + yOff}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={10} fontWeight="700" fill="#fff"
                      style={{ pointerEvents: "none" }}
                    >
                      {event.label}
                    </text>
                  </g>
                )
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        {selectedEvent && (
          <div style={{
            margin: "10px 4px 0",
            background: "#fff8f4",
            border: "1px solid #f0c4a0",
            borderRadius: 10,
            padding: "13px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: "700", color: "#f0a070", fontSize: 14 }}>{selectedEvent.label}</span>
                <span style={{ color: "#a0afc0", fontSize: 12 }}>{selectedEvent.year}</span>
              </div>
              <div style={{ fontSize: 12, color: "#5a6b5a" }}>{selectedEvent.detail}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: "700", color: "#2d4a3e" }}>
                {fmtUSD(PROJECTION.find(p => p.year === selectedEvent.year)?.value ?? 0)}
              </div>
              <div style={{ fontSize: 11, color: "#a0afc0" }}>Projected Net Worth</div>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#c0ccd8", fontSize: 20, lineHeight: 1, padding: "0 2px", flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ── Feature Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>

        {/* Card 1 – When can I retire? */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 3 }}>When can I retire?</div>
          <div style={{ fontSize: 12, color: "#a0afc0", marginBottom: 18 }}>Drag to set your target retirement age</div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#5a6b5a" }}>Retirement Age</span>
            <span style={{ fontSize: 28, fontWeight: "700", color: "#f0a070", lineHeight: 1 }}>{retireAge}</span>
          </div>

          <input
            type="range" min={55} max={75} value={retireAge}
            onChange={e => setRetireAge(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#f0a070", marginBottom: 6, cursor: "pointer", display: "block" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#c0ccd8", marginBottom: 18 }}>
            <span>55</span><span>65</span><span>75</span>
          </div>

          <div style={{ borderTop: "1px solid #f9f7f2", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#5a6b5a" }}>Target Year</span>
              <span style={{ fontSize: 12, fontWeight: "600", color: "#2d4a3e" }}>{retireYear}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#5a6b5a" }}>Projected Net Worth</span>
              <span style={{ fontSize: 12, fontWeight: "700", color: "#4caf84" }}>{fmtUSD(retireNetWorth)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#5a6b5a" }}>Est. Monthly Income</span>
              <span style={{ fontSize: 12, fontWeight: "600", color: "#2d4a3e" }}>{fmtUSD(retireMonthlyIncome)}/mo</span>
            </div>
            <div style={{ fontSize: 10, color: "#c0ccd8" }}>Based on 4% safe withdrawal rate</div>
          </div>
        </div>

        {/* Card 2 – Can I afford a home? */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 3 }}>Can I afford a home?</div>
          <div style={{ fontSize: 12, color: "#a0afc0", marginBottom: 18 }}>Enter a target price to see how close you are</div>

          <label style={{ fontSize: 12, color: "#5a6b5a", display: "block", marginBottom: 6 }}>Target Home Price</label>
          <div style={{ position: "relative", marginBottom: 18 }}>
            <span style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              color: "#5a6b5a", fontSize: 14, pointerEvents: "none",
            }}>$</span>
            <input
              type="number"
              value={homePrice}
              onChange={e => setHomePrice(Math.max(0, Number(e.target.value)))}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "10px 12px 10px 22px",
                border: "1px solid #e8eef4", borderRadius: 8,
                fontSize: 14, fontWeight: "600", color: "#2d4a3e",
                outline: "none", background: "#fff",
              }}
              onFocus={e => e.target.style.borderColor = "#f0a070"}
              onBlur={e => e.target.style.borderColor = "#e8eef4"}
            />
          </div>

          <div style={{ borderTop: "1px solid #f9f7f2", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#5a6b5a" }}>Down Payment (20%)</span>
              <span style={{ fontSize: 12, fontWeight: "600", color: "#2d4a3e" }}>{fmtUSD(downPayment)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#5a6b5a" }}>Current Savings</span>
              <span style={{ fontSize: 12, fontWeight: "600", color: "#4caf84" }}>{fmtUSD(LIQUID_SAVINGS)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#5a6b5a" }}>Remaining Gap</span>
              <span style={{ fontSize: 12, fontWeight: "700", color: savingsGap === 0 ? "#4caf84" : "#e07070" }}>
                {savingsGap === 0 ? "You're ready!" : fmtUSD(savingsGap)}
              </span>
            </div>
            <div style={{ background: "#f5f2eb", borderRadius: 8, padding: "10px 12px" }}>
              {savingsGap > 0 ? (
                <>
                  <div style={{ fontSize: 11, color: "#5a6b5a" }}>At $800/mo savings rate</div>
                  <div style={{ fontSize: 13, fontWeight: "700", color: "#2d4a3e", marginTop: 2 }}>
                    Ready in ~{monthsToSave < 12
                      ? `${monthsToSave} months`
                      : `${(monthsToSave / 12).toFixed(1)} years`}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, fontWeight: "700", color: "#4caf84" }}>
                  You have enough for a down payment!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3 – How does my future look? */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 3 }}>How does my future look?</div>
          <div style={{ fontSize: 12, color: "#a0afc0", marginBottom: 18 }}>Net worth milestones at a glance</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", background: "#f5f2eb", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#5a6b5a" }}>Today</span>
              <span style={{ fontSize: 13, fontWeight: "700", color: "#2d4a3e" }}>{fmtUSD(BASE_VALUE)}</span>
            </div>

            {milestones.map(m => (
              <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", background: "#f5f2eb", borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: "#5a6b5a" }}>{m.label}</span>
                <span style={{ fontSize: 13, fontWeight: "700", color: "#4caf84" }}>{fmtUSD(m.value)}</span>
              </div>
            ))}

            <div style={{
              padding: "12px 13px",
              background: "linear-gradient(135deg, rgba(240,160,112,0.12), rgba(240,160,112,0.06))",
              borderRadius: 8, border: "1px solid rgba(240,160,112,0.25)",
            }}>
              <div style={{ fontSize: 11, color: "#f0a070", fontWeight: "700", marginBottom: 2 }}>
                Retire at Age {retireAge} ({retireYear})
              </div>
              <div style={{ fontSize: 15, fontWeight: "700", color: "#2d4a3e" }}>{fmtUSD(retireNetWorth)}</div>
              <div style={{ fontSize: 11, color: "#a0afc0", marginTop: 2 }}>
                ~{fmtUSD(retireMonthlyIncome)}/mo income (4% SWR)
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Forecasting
