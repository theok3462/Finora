import { useState } from "react"
import { BarChart2, Shield, Home, CreditCard, TrendingUp } from "lucide-react"

const CATEGORIES = [
  { id: "all",      label: "Recommendations" },
  { id: "save",     label: "Save up"         },
  { id: "spend",    label: "Spend"           },
  { id: "paydown",  label: "Pay down"        },
  { id: "protect",  label: "Protect"         },
  { id: "invest",   label: "Invest"          },
  { id: "wellness", label: "Wellness"        },
]

const CARDS = [
  {
    id: 1,
    categoryId: "spend",
    label: "SPEND",
    color: "#5b8fd4",
    Icon: BarChart2,
    title: "Track your cash flow",
    description: "Understanding where your money goes each month is the foundation of good financial health. Review your income and expenses to find opportunities to save.",
    progress: 0,
    progressNote: null,
    tasks: 3,
  },
  {
    id: 2,
    categoryId: "save",
    label: "SAVE",
    color: "#4caf84",
    Icon: Shield,
    title: "Build an emergency fund",
    description: "You're 84% of the way to your $10,000 emergency fund goal. Keep building — you're close to having 6 months of essential expenses covered.",
    progress: 84,
    progressNote: "$8,400 / $10,000",
    tasks: 1,
  },
  {
    id: 3,
    categoryId: "invest",
    label: "INVEST",
    color: "#f0a070",
    Icon: Home,
    title: "Buy a home",
    description: "Homeownership builds equity over time and can be a powerful long-term wealth strategy. Start mapping your path to a down payment.",
    progress: 0,
    progressNote: null,
    tasks: 4,
  },
  {
    id: 4,
    categoryId: "paydown",
    label: "PAY DOWN",
    color: "#e07070",
    Icon: CreditCard,
    title: "Pay off debt",
    description: "You have an $843 credit card balance. Eliminating high-interest debt is one of the highest guaranteed returns you can earn right now.",
    progress: 0,
    progressNote: null,
    tasks: 2,
  },
  {
    id: 5,
    categoryId: "invest",
    label: "INVEST",
    color: "#9b7dd4",
    Icon: TrendingUp,
    title: "Start investing",
    description: "Time in the market beats timing the market. Small, consistent contributions compound significantly over decades — starting early is your biggest edge.",
    progress: 0,
    progressNote: null,
    tasks: 3,
  },
]

function countForCategory(id) {
  if (id === "all") return CARDS.length
  return CARDS.filter(c => c.categoryId === id).length
}

function AdviceCard({ card }) {
  const { Icon, color, label, title, description, progress, progressNote, tasks } = card

  return (
    <div
      style={{
        background: "#fff", borderRadius: 14,
        padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex", gap: 18, alignItems: "flex-start",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)"
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.10)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"
      }}
    >
      {/* Circle icon */}
      <div style={{
        width: 46, height: 46, borderRadius: "50%",
        background: color + "1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 1,
      }}>
        <Icon size={20} color={color} strokeWidth={2} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Row: category label + NOT STARTED badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: "700", letterSpacing: "0.08em",
            color, textTransform: "uppercase",
          }}>
            {label}
          </span>
          <span style={{
            fontSize: 10, fontWeight: "600", letterSpacing: "0.05em",
            color: "#a0afc0", background: "#f9f7f2",
            padding: "2px 9px", borderRadius: 20,
          }}>
            NOT STARTED
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: "700", color: "#2d4a3e", marginBottom: 6, lineHeight: 1.3 }}>
          {title}
        </div>

        {/* Description */}
        <div style={{ fontSize: 13, color: "#5a6b5a", lineHeight: 1.6, marginBottom: 13 }}>
          {description}
        </div>

        {/* Progress bar */}
        <div style={{
          background: "#f9f7f2", borderRadius: 999, height: 5,
          marginBottom: 10, overflow: "hidden",
        }}>
          <div style={{
            width: `${progress}%`, height: "100%",
            background: color, borderRadius: 999,
          }} />
        </div>

        {/* Bottom row: progress note + task count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {progressNote
            ? <span style={{ fontSize: 11, color: "#a0afc0" }}>{progressNote}</span>
            : <span />
          }
          <span style={{
            fontSize: 11, fontWeight: "600", color: "#a0afc0",
            background: "#f5f2eb", borderRadius: 20, padding: "2px 9px",
          }}>
            {tasks} task{tasks !== 1 ? "s" : ""}
          </span>
        </div>

      </div>
    </div>
  )
}

function Advice() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [hovered, setHovered] = useState(null)

  const activeCat    = CATEGORIES.find(c => c.id === activeCategory)
  const visibleCards = activeCategory === "all"
    ? CARDS
    : CARDS.filter(c => c.categoryId === activeCategory)

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>
      <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", margin: "0 0 4px" }}>Advice</h1>
      <p style={{ fontSize: 14, color: "#5a6b5a", margin: "0 0 24px" }}>
        Personalized recommendations to improve your financial health.
      </p>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* ── Left: category sidebar ── */}
        <div style={{
          width: 220, flexShrink: 0,
          background: "#fff", borderRadius: 14,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          padding: "10px 0 12px",
        }}>
          <div style={{
            padding: "4px 18px 10px",
            fontSize: 10, fontWeight: "700", color: "#a0afc0",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Categories
          </div>

          {CATEGORIES.map(cat => {
            const isActive  = activeCategory === cat.id
            const isHovered = hovered === cat.id && !isActive
            const count     = countForCategory(cat.id)

            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                onMouseEnter={() => setHovered(cat.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px",
                  margin: "1px 8px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: isActive ? "#2d4a3e" : isHovered ? "#f9f7f2" : "transparent",
                  color: isActive ? "#fff" : isHovered ? "#2d4a3e" : "#5a6b5a",
                  fontWeight: isActive ? "600" : "400",
                  fontSize: 14,
                  transition: "background 0.13s, color 0.13s",
                }}
              >
                <span>{cat.label}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: "600",
                    color: isActive ? "rgba(255,255,255,0.55)" : "#c0ccd8",
                    background: isActive ? "rgba(255,255,255,0.10)" : "#f9f7f2",
                    borderRadius: 10, padding: "1px 7px",
                    lineHeight: "18px",
                  }}>
                    {count}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Right: cards area ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Category heading */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: "700", color: "#2d4a3e" }}>
              {activeCat.label}
            </div>
            <div style={{ fontSize: 12, color: "#a0afc0", marginTop: 2 }}>
              {visibleCards.length} recommendation{visibleCards.length !== 1 ? "s" : ""}
            </div>
          </div>

          {visibleCards.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {visibleCards.map(card => <AdviceCard key={card.id} card={card} />)}
            </div>
          ) : (
            <div style={{
              background: "#fff", borderRadius: 14, padding: "52px 24px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center",
            }}>
              <div style={{ fontSize: 15, fontWeight: "600", color: "#2d4a3e", marginBottom: 6 }}>
                No advice for this category yet
              </div>
              <div style={{ fontSize: 13, color: "#a0afc0" }}>
                Check back as your financial profile evolves.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Advice
