import { LayoutDashboard, CreditCard, Target, TrendingUp, Landmark, BarChart2, PieChart, RefreshCw, Wallet, Compass, ThumbsUp, Sparkles } from "lucide-react"

const navItems = [
  { id: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { id: "accounts",     label: "Accounts",     icon: Landmark        },
  { id: "transactions", label: "Transactions", icon: CreditCard      },
  { id: "cashflow",     label: "Cash Flow",    icon: BarChart2       },
  { id: "reports",      label: "Reports",      icon: PieChart        },
  { id: "budget",       label: "Budget",       icon: Wallet          },
  { id: "recurring",    label: "Recurring",    icon: RefreshCw       },
  { id: "goals",        label: "Goals",        icon: Target          },
  { id: "investments",  label: "Investments",  icon: TrendingUp      },
  { id: "insights",     label: "Insights",     icon: TrendingUp      },
  { id: "forecasting",  label: "Forecasting",  icon: Compass         },
  { id: "advice",       label: "Advice",       icon: ThumbsUp        },
]

function Sidebar({ activePage, setActivePage }) {
  return (
    <div style={{
      width: 260,
      minHeight: "100vh",
      background: "#2d4a3e",
      padding: "40px 0",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: 0,
      top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 28px 36px", borderBottom: "1px solid #3d5e50" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 22 C13 22 13 14 7 9 C10 9 16 10 18 6 C18 6 19 14 13 22Z" fill="#c8e6c9" />
            <path d="M13 22 C13 22 13 15 18 11" stroke="#c8e6c9" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 22, fontWeight: "700", color: "#c8e6c9", fontFamily: "Georgia, 'Times New Roman', serif" }}>Finora</div>
        </div>
        <div style={{ fontSize: 13, color: "#5a6b5a", marginTop: 4, paddingLeft: 36 }}>Personal Finance</div>
      </div>

      {/* Nav Items */}
      <nav style={{ padding: "28px 16px", flex: 1 }}>
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <div key={item.id} onClick={() => setActivePage(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: 10, marginBottom: 6,
                cursor: "pointer",
                background: activePage === item.id ? "#3d5e50" : "transparent",
                color: activePage === item.id ? "#c8e6c9" : "#5a6b5a",
                transition: "all 0.2s",
                fontSize: 16, fontWeight: activePage === item.id ? "600" : "400"
              }}>
              <Icon size={20} />
              {item.label}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "28px", borderTop: "1px solid #3d5e50" }}>
        <div style={{ fontSize: 14, color: "#5a6b5a" }}>Theo Kliewer</div>
        <div style={{ fontSize: 12, color: "#4a6b5a" }}>theokliewer8@gmail.com</div>
      </div>
    </div>
  )
}

export default Sidebar