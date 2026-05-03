import { goals } from "../data"

const TODAY = new Date()
const fmt = (n) => n.toLocaleString("en-US")

function Goals() {
  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>
      <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", marginBottom: 8 }}>Goals</h1>
      <p style={{ fontSize: 14, color: "#5a6b5a", marginBottom: 28, marginTop: 0 }}>
        Track your savings progress toward each goal.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 24,
      }}>
        {goals.map(goal => {
          const pct = Math.round((goal.current / goal.target) * 100)
          const remaining = goal.target - goal.current
          const monthsToGo = Math.ceil(remaining / 250)
          const estDate = new Date(TODAY.getFullYear(), TODAY.getMonth() + monthsToGo, 1)
          const estLabel = "Est. " + estDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })

          return (
            <div key={goal.id} style={{
              borderRadius: 12,
              boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
              overflow: "hidden",
              background: "#fff",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.08)"
              }}
            >
              {/* Gradient header */}
              <div style={{
                background: `linear-gradient(135deg, ${goal.color}, ${goal.color}aa)`,
                padding: "22px 24px 24px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Decorative circles */}
                <div style={{
                  position: "absolute", right: -20, bottom: -20,
                  width: 90, height: 90, borderRadius: "50%",
                  background: "rgba(255,255,255,0.10)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute", right: 30, top: -30,
                  width: 70, height: 70, borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  pointerEvents: "none",
                }} />
                <div style={{ fontSize: 17, fontWeight: "700", color: "#fff", letterSpacing: "-0.01em", position: "relative" }}>
                  {goal.name}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3, position: "relative" }}>
                  Savings goal
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "20px 24px 22px" }}>

                {/* Current amount + target */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 30, fontWeight: "700", color: "#2d4a3e", lineHeight: 1 }}>
                    ${fmt(goal.current)}
                  </div>
                  <div style={{ fontSize: 13, color: "#5a6b5a", marginTop: 5 }}>
                    of ${fmt(goal.target)} goal
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{
                  background: "#f9f7f2", borderRadius: 999, height: 5,
                  marginBottom: 12, overflow: "hidden",
                }}>
                  <div style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: "100%",
                    background: goal.color,
                    borderRadius: 999,
                  }} />
                </div>

                {/* Percentage badge */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{
                    display: "inline-block",
                    background: `${goal.color}1a`,
                    color: goal.color,
                    borderRadius: 20,
                    padding: "3px 11px",
                    fontSize: 12,
                    fontWeight: "700",
                  }}>
                    {pct}% complete
                  </span>
                </div>

                {/* Footer: $X to go | Est. date */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  paddingTop: 12, borderTop: "1px solid #f9f7f2",
                }}>
                  <div style={{ fontSize: 13, color: "#5a6b5a" }}>
                    <span style={{ fontWeight: "600", color: "#2d4a3e" }}>${fmt(remaining)}</span> to go
                  </div>
                  <div style={{ fontSize: 12, color: "#a0afc0" }}>{estLabel}</div>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Goals
