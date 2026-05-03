import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { accounts, netWorthHistory, recurringPayments, goals } from "../data"

const PARENT_CATS = new Set([
  "Income", "Employment",
  "Housing",
  "Food", "Food & Dining",
  "Transport", "Transportation",
  "Health", "Health & Fitness",
  "Entertainment",
  "Social",
  "Shopping",
  "Subscriptions",
])

function Dashboard({ transactions }) {
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  const currentMonth = transactions.length > 0
    ? transactions.reduce((a, t) => t.date > a ? t.date : a, "").slice(0, 7)
    : new Date().toISOString().slice(0, 7)
  const [cmYear, cmMonth] = currentMonth.split("-")
  const currentMonthLabel = `${MONTH_NAMES[parseInt(cmMonth) - 1]} ${cmYear}`

  const totalIncome = transactions
    .filter(t => t.transaction_type === "income" && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const totalExpenses = transactions
    .filter(t => t.transaction_type === "expense" && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0)
  const recentTransactions = [...transactions].slice(0, 5)

  const categoryData = transactions
    .filter(t => t.transaction_type === "expense" && t.date.startsWith(currentMonth) && !PARENT_CATS.has(t.category))
    .reduce((acc, t) => {
      const existing = acc.find(item => item.category === t.category)
      if (existing) {
        existing.amount += parseFloat(t.amount)
      } else {
        acc.push({ category: t.category, amount: parseFloat(t.amount) })
      }
      return acc
    }, [])

  const card = (children) => (
    <div style={{
      background: "#fff", borderRadius: 14, padding: 20,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16
    }}>
      {children}
    </div>
  )

  const sectionTitle = (title, sub) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: "700", color: "#2d4a3e" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "#5a6b5a", marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>

      <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", marginBottom: 24 }}>
        Good afternoon, Theo! 👋
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>

        {/* LEFT COLUMN */}
        <div>
          {/* Budget */}
          {card(<>
            {sectionTitle("Budget", currentMonthLabel)}
            {[
              { label: "Income", budget: 3440, actual: totalIncome, color: "#4caf84" },
              { label: "Expenses", budget: 1473, actual: totalExpenses, color: "#e07070" },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: "500", color: "#2d4a3e" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "#5a6b5a" }}>${item.budget.toLocaleString()} budget</div>
                </div>
                <div style={{ background: "#f9f7f2", borderRadius: 999, height: 5, marginBottom: 4 }}>
                  <div style={{
                    width: `${Math.min((item.actual / item.budget) * 100, 100)}%`,
                    height: "100%", background: item.color, borderRadius: 999
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12, color: "#5a6b5a" }}>
                    ${item.actual.toFixed(2)} {item.label === "Income" ? "received" : "spent"}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: "600",
                    color: item.label === "Income" && item.actual > item.budget ? "#4caf84" : item.color }}>
                    {item.label === "Income" && item.actual > item.budget
                      ? "Over goal"
                      : `$${(item.budget - item.actual).toFixed(2)} remaining`}
                  </div>
                </div>
              </div>
            ))}
          </>)}

          {/* Net Worth */}
          {card(<>
            {sectionTitle("Net Worth", `$${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}`)}
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={netWorthHistory}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8e6c9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c8e6c9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "#5a6b5a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Area type="monotone" dataKey="value" stroke="#5b8fd4" fill="url(#netWorthGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </>)}

          {/* Goals */}
          {card(<>
            {sectionTitle("Goals", "Your top priorities")}
            {goals.map(goal => (
              <div key={goal.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: "500", color: "#2d4a3e" }}>{goal.name}</div>
                  <div style={{ fontSize: 12, color: "#5a6b5a" }}>${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</div>
                </div>
                <div style={{ background: "#f9f7f2", borderRadius: 999, height: 5 }}>
                  <div style={{
                    width: `${(goal.current / goal.target) * 100}%`,
                    height: "100%", background: goal.color, borderRadius: 999
                  }} />
                </div>
              </div>
            ))}
          </>)}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Spending Chart */}
          {card(<>
            {sectionTitle("Spending by Category")}
            {categoryData.length === 0
              ? <p style={{ color: "#5a6b5a", fontSize: 13 }}>No expense data yet.</p>
              : <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={categoryData} barSize={32}>
                    <XAxis dataKey="category" tick={{ fill: "#5a6b5a", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#5a6b5a", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`}
                      contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="amount" fill="#c8e6c9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </>)}

          {/* Recent Transactions */}
          {card(<>
            {sectionTitle("Transactions", "Most recent")}
            {recentTransactions.length === 0
              ? <p style={{ color: "#5a6b5a", fontSize: 13 }}>No transactions yet.</p>
              : recentTransactions.map(t => (
                <div key={t.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0", borderBottom: "1px solid #f9f7f2"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: "500", color: "#2d4a3e" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "#5a6b5a" }}>{t.category} • {t.date}</div>
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: "600",
                    color: t.transaction_type === "income" ? "#4caf84" : "#e07070"
                  }}>
                    {t.transaction_type === "income" ? "+" : "-"}${t.amount}
                  </div>
                </div>
              ))
            }
          </>)}

          {/* Recurring */}
          {card(<>
            {sectionTitle("Recurring", "This month")}
            {recurringPayments.map(r => (
              <div key={r.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid #f9f7f2"
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: "500", color: "#2d4a3e" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "#5a6b5a" }}>{r.category} • {r.frequency}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: "600", color: "#2d4a3e" }}>${r.amount}</div>
                  <div style={{ fontSize: 11, color: "#5a6b5a" }}>Due May {r.dueDay}</div>
                </div>
              </div>
            ))}
          </>)}
        </div>
      </div>
    </div>
  )
}

export default Dashboard