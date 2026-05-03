import { useState } from "react"
import { goals as initialGoals } from "../data"

const TODAY = new Date()
const fmt = (n) => n.toLocaleString("en-US")

function Goals() {
  const [goals, setGoals] = useState(initialGoals)
  const [modal, setModal] = useState(null)
  const [amount, setAmount] = useState("")

  function handleAdd() {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    setGoals(prev => prev.map(g => g.id === modal.goalId ? { ...g, current: Math.min(g.current + val, g.target) } : g))
    setModal(null)
    setAmount("")
  }

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>
      <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", marginBottom: 8 }}>Goals</h1>
      <p style={{ fontSize: 14, color: "#5a6b5a", marginBottom: 28, marginTop: 0 }}>Track your savings progress toward each goal.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
        {goals.map(goal => {
          const pct = Math.round((goal.current / goal.target) * 100)
          const remaining = goal.target - goal.current
          const monthsToGo = Math.ceil(remaining / 250)
          const estDate = new Date(TODAY.getFullYear(), TODAY.getMonth() + monthsToGo, 1)
          const estLabel = "Est. " + estDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
          return (
            <div key={goal.id} style={{ borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", overflow: "hidden", background: "#fff", transition: "transform 0.15s, box-shadow 0.15s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.12)" }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.08)" }}>
              <div style={{ background: `linear-gradient(135deg, ${goal.color}, ${goal.color}aa)`, padding: "22px 24px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ position: "absolute", bottom: -30, right: 20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{goal.type}</div>
                <div style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>{goal.name}</div>
              </div>
              <div style={{ padding: "20px 24px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e" }}>${fmt(goal.current)}</span>
                  <span style={{ fontSize: 13, color: "#5a6b5a" }}>of ${fmt(goal.target)} goal</span>
                </div>
                <div style={{ background: "#f0f4f0", borderRadius: 99, height: 8, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: goal.color, borderRadius: 99, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5a6b5a", marginBottom: 16 }}>
                  <span style={{ fontWeight: "600", color: goal.color }}>{pct}% complete</span>
                  <span>{pct < 100 ? `$${fmt(remaining)} to go` : "🎉 Goal reached!"}</span>
                </div>
                <div style={{ paddingTop: 12, borderTop: "1px solid #f9f7f2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#a0afc0" }}>{pct < 100 ? estLabel : "Completed"}</span>
                  {pct < 100 && <button onClick={() => { setModal({ goalId: goal.id }); setAmount("") }} style={{ background: goal.color, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: "600", cursor: "pointer" }}>+ Add Funds</button>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {modal && (() => {
        const goal = goals.find(g => g.id === modal.goalId)
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setModal(null)}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 340, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: "0 0 6px", fontSize: 18, color: "#2d4a3e" }}>Add Funds</h2>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#5a6b5a" }}>{goal.name} · ${fmt(goal.current)} of ${fmt(goal.target)}</p>
              <input type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} autoFocus style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e0e8e0", fontSize: 15, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1.5px solid #e0e8e0", background: "#fff", color: "#5a6b5a", fontSize: 14, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleAdd} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: goal.color, color: "#fff", fontSize: 14, fontWeight: "600", cursor: "pointer" }}>Add Funds</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default Goals
