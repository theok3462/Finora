import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import axios from "axios"
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react"
import { CATEGORY_GROUPS, SUBCATEGORY_TO_GROUP } from "../data"

const TX_API = "http://127.0.0.1:8000/api/transactions/"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

const INCOME_ROWS = [
  { id: "hourly",    name: "Hourly",    category: "Hourly"    },
  { id: "tips",      name: "Tips",      category: "Tips"      },
  { id: "freelance", name: "Freelance", category: "Freelance" },
]

const INCOME_IDS = new Set(INCOME_ROWS.map(r => r.id))

const EXPENSE_GROUPS_INITIAL = [
  { id: "housing",       name: "Housing",         rows: [
    { id: "rent",          name: "Rent",              category: "Rent"             },
  ]},
  { id: "food",          name: "Food & Dining",    rows: [
    { id: "groceries",     name: "Groceries",         category: "Groceries"  },
    { id: "diningout",     name: "Dining Out",        category: "Dining Out" },
  ]},
  { id: "transport",     name: "Transportation",   rows: [
    { id: "gas",           name: "Gas",               category: "Gas"        },
    { id: "uberlift",      name: "Uber/Lyft",         category: "Uber/Lyft"  },
  ]},
  { id: "subscriptions", name: "Subscriptions",    rows: [
    { id: "netflix",       name: "Netflix",           category: "Netflix"          },
    { id: "spotify",       name: "Spotify",           category: "Spotify"          },
    { id: "chatgpt",       name: "ChatGPT",           category: "ChatGPT"          },
    { id: "googleone",     name: "Google One",        category: "Google One"       },
  ]},
  { id: "health",        name: "Health & Fitness", rows: [
    { id: "lifetime",      name: "Lifetime Fitness",  category: "Lifetime Fitness" },
    { id: "supplements",   name: "Supplements",       category: "Supplements"      },
  ]},
  { id: "entertainment", name: "Entertainment",    rows: [
    { id: "movies",        name: "Movies",            category: "Movies"           },
    { id: "concerts",      name: "Concerts",          category: "Concerts"         },
  ]},
  { id: "social",        name: "Social",           rows: [
    { id: "dates",         name: "Dates",             category: "Dates"            },
    { id: "friendsnight",  name: "Friends Night",     category: "Friends Night"    },
  ]},
  { id: "shopping",      name: "Shopping",         rows: [
    { id: "clothes",       name: "Clothes",           category: "Clothes"    },
    { id: "homegoods",     name: "Home Goods",        category: "Home Goods" },
  ]},
]

const INITIAL_BUDGETS = {
  hourly: 2100, tips: 840, freelance: 500,
  rent: 750, groceries: 200, diningout: 100, gas: 60, uberlift: 20,
  netflix: 15.99, spotify: 9.99, chatgpt: 20, googleone: 2.99,
  lifetime: 49.99, supplements: 40, movies: 30, concerts: 50,
  dates: 100, friendsnight: 60, clothes: 80, homegoods: 50,
}

// 5-column grid: name | budget | actual | remaining | chevron
const COLS = "1fr 90px 80px 95px 28px"

const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function TransactionDrawer({ row, budget, actual, transactions, monthKey, visible, onClose, isIncome, onUpdateTransaction }) {
  const txns = transactions
    .filter(t => t.category === row.category && t.date && t.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date))

  const total       = txns.reduce((s, t) => s + parseFloat(t.amount), 0)
  const rem         = budget - actual
  const spentLabel  = isIncome ? "Earned" : "Spent"
  const spentColor  = isIncome ? "#4caf84" : (actual > budget ? "#e07070" : "#5a6b5a")
  const remainColor = isIncome ? (rem <= 0 ? "#4caf84" : "#5a6b5a") : (rem < 0 ? "#e07070" : "#4caf84")
  const amtColor    = isIncome ? "#4caf84" : "#e07070"
  const amtPrefix   = isIncome ? "+" : "-"

  const [editingTxId, setEditingTxId] = useState(null)

  const handleTxCategoryChange = (id, newCategory) => {
    setEditingTxId(null)
    const parentCat = SUBCATEGORY_TO_GROUP[newCategory] || ""
    axios.patch(`${TX_API}${id}/`, { category: newCategory, parent_category: parentCat })
      .then(res => onUpdateTransaction(id, res.data))
      .catch(err => console.error("Failed to update category:", err))
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.45)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 360,
        background: "#fff", zIndex: 401,
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column",
        boxShadow: "-6px 0 32px rgba(0,0,0,0.14)",
      }}>
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #f9f7f2" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 17, fontWeight: "700", color: "#2d4a3e" }}>{row.name}</div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "#f9f7f2", cursor: "pointer", flexShrink: 0, marginLeft: 8,
              display: "flex", alignItems: "center", justifyContent: "center", color: "#5a6b5a",
            }}>
              <X size={15} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Budget",    value: `$${fmt(budget)}`, color: "#2d4a3e"   },
              { label: spentLabel,  value: `$${fmt(actual)}`, color: spentColor  },
              { label: "Remaining", value: `$${fmt(rem)}`,    color: remainColor },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 10, fontWeight: "600", color: "#8a9e8a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: "600", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {txns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#8a9e8a", fontSize: 14 }}>
              No transactions this month
            </div>
          ) : txns.map(t => (
            <div key={t.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "13px 24px", borderBottom: "1px solid #f9f7f2",
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: "500", color: "#2d4a3e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: "#8a9e8a" }}>{t.date}</div>
                  {editingTxId === t.id ? (
                    <select
                      autoFocus
                      defaultValue={t.category}
                      onChange={e => handleTxCategoryChange(t.id, e.target.value)}
                      onBlur={() => setEditingTxId(null)}
                      onKeyDown={e => e.key === "Escape" && setEditingTxId(null)}
                      style={{
                        fontSize: 11, padding: "2px 6px", borderRadius: 6,
                        border: "1.5px solid #c8e6c9", outline: "none",
                        background: "#fff", color: "#2d4a3e", cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {CATEGORY_GROUPS.map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.items.map(item => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  ) : (
                    <div
                      onClick={() => setEditingTxId(t.id)}
                      title="Click to change category"
                      style={{
                        fontSize: 11, color: "#5a6b5a", background: "#f9f7f2",
                        padding: "2px 8px", borderRadius: 20,
                        cursor: "pointer", userSelect: "none",
                      }}
                    >
                      {t.category}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: "600", color: amtColor, flexShrink: 0, marginLeft: 16 }}>
                {amtPrefix}${fmt(parseFloat(t.amount))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "2px solid #e8e4da", background: "#f9f7f2",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 13, color: "#5a6b5a" }}>
            {txns.length} transaction{txns.length !== 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 14, fontWeight: "700", color: amtColor }}>
            {amtPrefix}${fmt(total)}
          </div>
        </div>
      </div>
    </>
  )
}

function BudgetRow({ row, budget, actual, onBudgetChange, onOpen }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const rem = budget - actual
  const pct = budget > 0 ? actual / budget : 0

  let barColor
  if (pct > 1) {
    barColor = "#e07070"
  } else if (pct === 1) {
    barColor = "#f5c842"
  } else {
    barColor = "#4caf84"
  }

  return (
    <div
      onClick={() => onOpen(row)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: COLS, alignItems: "center",
        padding: "10px 20px", borderBottom: "1px solid #f9f7f2",
        background: hovered ? "#f0f5f2" : "#fff",
        cursor: "pointer", transition: "background 0.12s",
      }}
    >
      {/* Name + progress bar */}
      <div style={{ paddingLeft: 12 }}>
        <div style={{ fontSize: 13, color: "#2d4a3e" }}>{row.name}</div>
        {budget > 0 && (
          <div style={{ position: "relative", marginTop: 5, width: "80%" }}>
            {/* Track */}
            <div style={{ height: 8, borderRadius: 4, background: "#e8e4da", overflow: "hidden" }}>
              {/* Fill */}
              <div style={{
                width: `${Math.min(pct * 100, 100)}%`, height: "100%",
                background: barColor,
                borderRadius: "4px 0 0 4px",
                transition: "width 0.2s ease",
              }} />
            </div>
            {/* Budget boundary line — always visible at 100% mark */}
            <div style={{
              position: "absolute",
              top: -3, bottom: -3,
              left: "100%",
              width: 2,
              background: "#1a1a1a",
              transform: "translateX(-2px)",
            }} />
          </div>
        )}
      </div>

      {/* Budget — formatted display, click to edit */}
      <div style={{ textAlign: "right" }}>
        {focused ? (
          <input
            type="number" autoFocus value={budget || ""}
            onClick={e => e.stopPropagation()}
            onChange={e => onBudgetChange(row.id, parseFloat(e.target.value) || 0)}
            onBlur={() => setFocused(false)}
            style={{
              width: 70, textAlign: "right", border: "none",
              borderBottom: "1px solid #c8e6c9", background: "transparent",
              fontSize: 13, color: "#2d4a3e", outline: "none", fontFamily: "inherit",
            }}
          />
        ) : (
          <div
            onClick={e => { e.stopPropagation(); setFocused(true) }}
            style={{ fontSize: 13, color: "#2d4a3e", cursor: "text", userSelect: "none" }}
          >
            {budget > 0 ? `$${fmt(budget)}` : "—"}
          </div>
        )}
      </div>

      {/* Actual */}
      <div style={{ textAlign: "right", fontSize: 13, color: "#5a6b5a" }}>
        {actual > 0 ? `$${fmt(actual)}` : "—"}
      </div>

      {/* Remaining */}
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: "600", color: budget > 0 ? (rem < 0 ? "#e07070" : "#4caf84") : "#5a6b5a" }}>
        {budget > 0 ? `$${fmt(rem)}` : "—"}
      </div>

      {/* Chevron */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <ChevronRight size={14} color={hovered ? "#5a6b5a" : "#c8e6c9"} style={{ transition: "color 0.12s", flexShrink: 0 }} />
      </div>
    </div>
  )
}

function GroupHeader({ group, isOpen, onToggle, budgets, actuals }) {
  const gb = group.rows.reduce((s, r) => s + (budgets[r.id] || 0), 0)
  const ga = group.rows.reduce((s, r) => s + (actuals[r.id] || 0), 0)
  const gr = gb - ga

  return (
    <div onClick={() => onToggle(group.id)} style={{
      display: "grid", gridTemplateColumns: COLS, alignItems: "center",
      padding: "12px 20px", cursor: "pointer",
      background: "#f5f2eb", borderBottom: "1px solid #e8eef4",
    }}>
      <div style={{ fontSize: 14, fontWeight: "600", color: "#2d4a3e", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 10, color: "#8a9e8a", userSelect: "none" }}>{isOpen ? "▼" : "▶"}</span>
        {group.name}
      </div>
      <div style={{ textAlign: "right", fontSize: 13, color: "#5a6b5a" }}>{gb > 0 ? `$${fmt(gb)}` : "—"}</div>
      <div style={{ textAlign: "right", fontSize: 13, color: "#5a6b5a" }}>{ga > 0 ? `$${fmt(ga)}` : "—"}</div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: "600", color: gb > 0 ? (gr < 0 ? "#e07070" : "#4caf84") : "#5a6b5a" }}>
        {gb > 0 ? `$${fmt(gr)}` : "—"}
      </div>
      <div />
    </div>
  )
}

function Budget({ transactions, onUpdateTransaction }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const [viewMode,    setViewMode]    = useState("month")
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && transactions.length > 0) {
      const latest = transactions.reduce((a, t) => t.date > a ? t.date : a, "")
      const [ly, lm] = latest.slice(0, 7).split("-").map(Number)
      const now = new Date()
      const offset = (ly - now.getFullYear()) * 12 + (lm - 1 - now.getMonth())
      setMonthOffset(offset)
      initialized.current = true
    }
  }, [transactions])

  const [budgets,       setBudgets]       = useState(INITIAL_BUDGETS)
  const [expenseGroups, setExpenseGroups] = useState(EXPENSE_GROUPS_INITIAL)
  const [collapsed,     setCollapsed]     = useState({})
  const [sidebarTab,    setSidebarTab]    = useState("summary")
  const [drawerRow,     setDrawerRow]     = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)

  // Add-subcategory state
  const [addingGroupId, setAddingGroupId] = useState(null)
  const [addForm,       setAddForm]       = useState({ name: "", amount: "" })
  const [addError,      setAddError]      = useState("")
  const [hoveredGroupId,setHoveredGroupId]= useState(null)
  const [showZero,      setShowZero]      = useState({})

  const allRows = useMemo(() => expenseGroups.flatMap(g => g.rows), [expenseGroups])

  const openDrawer = useCallback((row) => {
    setDrawerRow(row)
    setDrawerVisible(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)))
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false)
    setTimeout(() => setDrawerRow(null), 260)
  }, [])

  useEffect(() => {
    if (!drawerRow) return
    const onKey = (e) => { if (e.key === "Escape") closeDrawer() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [drawerRow, closeDrawer])

  const today        = new Date()
  const base         = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const displayMonth = base.getMonth()
  const displayYear  = base.getFullYear()
  const monthKey     = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}`

  const actuals = useMemo(() => {
    // Build category → rowId lookup dynamically so new subcategories get picked up
    const catToId = {}
    for (const r of INCOME_ROWS) catToId[r.category] = r.id
    for (const g of expenseGroups) for (const r of g.rows) catToId[r.category] = r.id

    const map = {}
    for (const t of transactions) {
      if (!t.date || !t.date.startsWith(monthKey)) continue
      const rowId = catToId[t.category]
      if (rowId) map[rowId] = (map[rowId] || 0) + parseFloat(t.amount)
    }
    return map
  }, [transactions, monthKey, expenseGroups])

  const totalIncomeBudget  = INCOME_ROWS.reduce((s, r) => s + (budgets[r.id] || 0), 0)
  const totalExpenseBudget = allRows.reduce((s, r) => s + (budgets[r.id] || 0), 0)
  const totalIncomeActual  = INCOME_ROWS.reduce((s, r) => s + (actuals[r.id] || 0), 0)
  const totalExpenseActual = allRows.reduce((s, r) => s + (actuals[r.id] || 0), 0)
  const leftToBudget = totalIncomeBudget - totalExpenseBudget

  const handleBudgetChange = useCallback((rowId, value) => {
    setBudgets(prev => ({ ...prev, [rowId]: value }))
  }, [])

  const toggleGroup = useCallback((id) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const openAdd = (groupId) => {
    setAddingGroupId(groupId)
    setAddForm({ name: "", amount: "" })
    setAddError("")
  }

  const cancelAdd = () => {
    setAddingGroupId(null)
    setAddForm({ name: "", amount: "" })
    setAddError("")
  }

  const handleAddSubcategory = (groupId) => {
    const name = addForm.name.trim()
    const amt  = parseFloat(addForm.amount)

    if (!name) { setAddError("Name is required"); return }
    if (isNaN(amt) || amt < 0) { setAddError("Enter a valid amount"); return }

    const group = expenseGroups.find(g => g.id === groupId)
    if (group.rows.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      setAddError("Already exists in this group")
      return
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") + "_" + Date.now()
    setExpenseGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, rows: [...g.rows, { id, name, category: name }] } : g
    ))
    setBudgets(prev => ({ ...prev, [id]: amt }))
    cancelAdd()
  }

  return (
    <div style={{ width: "100%", paddingBottom: 80, position: "relative" }}>

      {drawerRow && (
        <TransactionDrawer
          row={drawerRow}
          budget={budgets[drawerRow.id] || 0}
          actual={actuals[drawerRow.id] || 0}
          transactions={transactions}
          monthKey={monthKey}
          visible={drawerVisible}
          onClose={closeDrawer}
          isIncome={INCOME_IDS.has(drawerRow.id)}
          onUpdateTransaction={onUpdateTransaction}
        />
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setMonthOffset(p => p - 1)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#5a6b5a", padding: "4px 6px", borderRadius: 6, display: "flex" }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 20, fontWeight: "700", color: "#2d4a3e", minWidth: 190, textAlign: "center" }}>
            {MONTH_NAMES[displayMonth]} {displayYear}
          </span>
          <button onClick={() => setMonthOffset(p => p + 1)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#5a6b5a", padding: "4px 6px", borderRadius: 6, display: "flex" }}>
            <ChevronRight size={20} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setMonthOffset(0)}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e8e4da", background: "#fff",
              cursor: "pointer", fontSize: 13, color: "#5a6b5a", fontFamily: "inherit" }}>
            Today
          </button>
          {["Month","Year","Decade"].map(m => (
            <button key={m} onClick={() => setViewMode(m.toLowerCase())}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontFamily: "inherit",
                background: viewMode === m.toLowerCase() ? "#2d4a3e" : "#f9f7f2",
                color: viewMode === m.toLowerCase() ? "#c8e6c9" : "#5a6b5a",
              }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* Main table */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Sticky column headers */}
          <div style={{
            display: "grid", gridTemplateColumns: COLS, padding: "7px 20px",
            position: "sticky", top: 0, zIndex: 10,
            background: "#f0ede6",
            borderBottom: "1px solid #e0ddd6",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            marginBottom: 8,
          }}>
            {["Category", "Budget", "Actual", "Remaining", ""].map((h, i) => (
              <div key={h || "chevron"} style={{
                fontSize: 11, fontWeight: "600", color: "#8a9e8a",
                textTransform: "uppercase", letterSpacing: "0.05em",
                textAlign: i > 0 ? "right" : "left",
              }}>
                {h}
              </div>
            ))}
          </div>

          {/* Income card */}
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 12 }}>
            <div onClick={() => toggleGroup("income")} style={{
              display: "grid", gridTemplateColumns: COLS, alignItems: "center",
              padding: "12px 20px", cursor: "pointer",
              background: "#f5f2eb", borderBottom: !collapsed["income"] ? "1px solid #e8eef4" : "none",
            }}>
              <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#8a9e8a", userSelect: "none" }}>{!collapsed["income"] ? "▼" : "▶"}</span>
                Income
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: "#5a6b5a" }}>${fmt(totalIncomeBudget)}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: "#5a6b5a" }}>{totalIncomeActual > 0 ? `$${fmt(totalIncomeActual)}` : "—"}</div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: "600", color: "#4caf84" }}>
                ${fmt(totalIncomeBudget - totalIncomeActual)}
              </div>
              <div />
            </div>
            {!collapsed["income"] && INCOME_ROWS.map(row => (
              <BudgetRow key={row.id} row={row} budget={budgets[row.id] || 0} actual={actuals[row.id] || 0} onBudgetChange={handleBudgetChange} onOpen={openDrawer} />
            ))}
            <div style={{
              display: "grid", gridTemplateColumns: COLS, padding: "11px 20px",
              background: "#f9f7f2", borderTop: "2px solid #e8e4da",
            }}>
              <div style={{ fontSize: 13, fontWeight: "700", color: "#2d4a3e" }}>Total Income</div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: "700", color: "#2d4a3e" }}>${fmt(totalIncomeBudget)}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: "#5a6b5a" }}>{totalIncomeActual > 0 ? `$${fmt(totalIncomeActual)}` : "—"}</div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: "700", color: "#4caf84" }}>${fmt(totalIncomeBudget - totalIncomeActual)}</div>
              <div />
            </div>
          </div>

          {/* Expenses card */}
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 12 }}>
            {expenseGroups.map(group => (
              <div key={group.id}
                onMouseEnter={() => setHoveredGroupId(group.id)}
                onMouseLeave={() => setHoveredGroupId(null)}
              >
                <GroupHeader group={group} isOpen={!collapsed[group.id]} onToggle={toggleGroup} budgets={budgets} actuals={actuals} />

                {!collapsed[group.id] && group.rows.filter(r => (budgets[r.id] || 0) > 0).map(row => (
                  <BudgetRow key={row.id} row={row} budget={budgets[row.id] || 0} actual={actuals[row.id] || 0} onBudgetChange={handleBudgetChange} onOpen={openDrawer} />
                ))}

                {!collapsed[group.id] && showZero[group.id] && group.rows.filter(r => (budgets[r.id] || 0) === 0).map(row => (
                  <div key={row.id} style={{ opacity: 0.55 }}>
                    <BudgetRow row={row} budget={0} actual={actuals[row.id] || 0} onBudgetChange={handleBudgetChange} onOpen={openDrawer} />
                  </div>
                ))}

                {!collapsed[group.id] && group.rows.some(r => (budgets[r.id] || 0) === 0) && (
                  <div style={{ padding: "3px 20px 4px 32px" }}>
                    <button
                      onClick={e => { e.stopPropagation(); setShowZero(prev => ({ ...prev, [group.id]: !prev[group.id] })) }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 12, color: "#a0afa0", fontStyle: "italic",
                        padding: "2px 0", fontFamily: "inherit",
                      }}
                    >
                      {showZero[group.id]
                        ? "Hide hidden subcategories"
                        : `Show ${group.rows.filter(r => (budgets[r.id] || 0) === 0).length} hidden subcategor${group.rows.filter(r => (budgets[r.id] || 0) === 0).length === 1 ? "y" : "ies"}`
                      }
                    </button>
                  </div>
                )}

                {/* Inline add form */}
                {!collapsed[group.id] && addingGroupId === group.id && (
                  <div style={{
                    display: "grid", gridTemplateColumns: COLS, alignItems: "center",
                    padding: "8px 20px", borderBottom: "1px solid #f9f7f2",
                    background: "#fafcfa",
                  }}>
                    <div style={{ paddingLeft: 12 }}>
                      <input
                        autoFocus
                        placeholder="Subcategory name"
                        value={addForm.name}
                        onChange={e => { setAddForm(f => ({ ...f, name: e.target.value })); setAddError("") }}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleAddSubcategory(group.id)
                          if (e.key === "Escape") cancelAdd()
                        }}
                        style={{
                          fontSize: 13, padding: "4px 8px", borderRadius: 6,
                          border: addError ? "1px solid #e07070" : "1px solid #c8e6c9",
                          outline: "none", width: "85%", fontFamily: "inherit", color: "#2d4a3e",
                          background: "#fff",
                        }}
                      />
                      {addError && (
                        <div style={{ fontSize: 11, color: "#e07070", marginTop: 3 }}>{addError}</div>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={addForm.amount}
                        onChange={e => { setAddForm(f => ({ ...f, amount: e.target.value })); setAddError("") }}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleAddSubcategory(group.id)
                          if (e.key === "Escape") cancelAdd()
                        }}
                        style={{
                          fontSize: 13, padding: "4px 6px", borderRadius: 6,
                          border: "1px solid #c8e6c9", outline: "none",
                          width: 70, textAlign: "right", fontFamily: "inherit", color: "#2d4a3e",
                          background: "#fff",
                        }}
                      />
                    </div>

                    <div style={{ textAlign: "right", fontSize: 13, color: "#c0ccd8" }}>—</div>

                    {/* Save / Cancel */}
                    <div style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 6 }}>
                      <button
                        onClick={() => handleAddSubcategory(group.id)}
                        style={{
                          padding: "3px 10px", borderRadius: 6, border: "none",
                          background: "#2d4a3e", color: "#c8e6c9",
                          fontSize: 12, fontWeight: "600", cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelAdd}
                        style={{
                          padding: "3px 8px", borderRadius: 6,
                          border: "1px solid #e8e4da", background: "#fff",
                          fontSize: 12, color: "#5a6b5a", cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                    <div />
                  </div>
                )}

                {/* + Add button — visible on hover when form is not open */}
                {!collapsed[group.id] && addingGroupId !== group.id && (
                  <div style={{
                    padding: "5px 20px 6px 44px",
                    opacity: hoveredGroupId === group.id ? 1 : 0,
                    transition: "opacity 0.15s",
                    pointerEvents: hoveredGroupId === group.id ? "auto" : "none",
                  }}>
                    <button
                      onClick={() => openAdd(group.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 12, color: "#8a9e8a", padding: "2px 0",
                        display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#4caf84"}
                      onMouseLeave={e => e.currentTarget.style.color = "#8a9e8a"}
                    >
                      <Plus size={11} /> Add subcategory
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div style={{
              display: "grid", gridTemplateColumns: COLS, padding: "11px 20px",
              background: "#f9f7f2", borderTop: "2px solid #e8e4da",
            }}>
              <div style={{ fontSize: 13, fontWeight: "700", color: "#2d4a3e" }}>Total Expenses</div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: "700", color: "#2d4a3e" }}>${fmt(totalExpenseBudget)}</div>
              <div style={{ textAlign: "right", fontSize: 13, color: "#5a6b5a" }}>{totalExpenseActual > 0 ? `$${fmt(totalExpenseActual)}` : "—"}</div>
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: "700", color: totalExpenseActual > totalExpenseBudget ? "#e07070" : "#4caf84" }}>
                ${fmt(totalExpenseBudget - totalExpenseActual)}
              </div>
              <div />
            </div>
          </div>

        </div>

        {/* Right sidebar */}
        <div style={{ width: 270, flexShrink: 0, position: "sticky", top: 0, alignSelf: "flex-start" }}>
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

            <div style={{ background: "#2d4a3e", padding: "20px 24px" }}>
              <div style={{ fontSize: 11, color: "#a8d0be", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Left to Budget
              </div>
              <div style={{ fontSize: 28, fontWeight: "700", color: "#c8e6c9" }}>
                ${fmt(leftToBudget)}
              </div>
              <div style={{ fontSize: 12, color: "#a8d0be", marginTop: 4 }}>
                ${fmt(totalIncomeBudget)} − ${fmt(totalExpenseBudget)}
              </div>
            </div>

            <div style={{ display: "flex", borderBottom: "1px solid #f9f7f2" }}>
              {["summary","income","expenses"].map(tab => (
                <button key={tab} onClick={() => setSidebarTab(tab)}
                  style={{
                    flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                    fontSize: 12, fontFamily: "inherit",
                    background: sidebarTab === tab ? "#fff" : "#f5f2eb",
                    color: sidebarTab === tab ? "#2d4a3e" : "#5a6b5a",
                    fontWeight: sidebarTab === tab ? "600" : "400",
                    borderBottom: sidebarTab === tab ? "2px solid #5b8fd4" : "2px solid transparent",
                    textTransform: "capitalize",
                  }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ padding: "16px 20px" }}>

              {sidebarTab === "summary" && <>
                {[
                  { label: "Income",   bud: totalIncomeBudget,  act: totalIncomeActual,  color: "#4caf84" },
                  { label: "Expenses", bud: totalExpenseBudget, act: totalExpenseActual, color: "#e07070" },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 12, color: "#5a6b5a" }}>{item.label}</div>
                      <div style={{ fontSize: 12, fontWeight: "600", color: "#2d4a3e" }}>${fmt(item.bud)}</div>
                    </div>
                    <div style={{ background: "#f9f7f2", borderRadius: 999, height: 5, marginBottom: 4 }}>
                      <div style={{
                        width: `${item.bud > 0 ? Math.min((item.act / item.bud) * 100, 100) : 0}%`,
                        height: "100%", background: item.color, borderRadius: 999,
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 11, color: "#5a6b5a" }}>Actual ${fmt(item.act)}</div>
                      <div style={{ fontSize: 11, color: item.color }}>Left ${fmt(item.bud - item.act)}</div>
                    </div>
                  </div>
                ))}
                <div style={{ paddingTop: 12, borderTop: "1px solid #f9f7f2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12, color: "#5a6b5a" }}>Net Savings</div>
                    <div style={{ fontSize: 13, fontWeight: "700", color: "#5b8fd4" }}>
                      ${fmt(totalIncomeActual - totalExpenseActual)}
                    </div>
                  </div>
                </div>
              </>}

              {sidebarTab === "income" && <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px", marginBottom: 8 }}>
                  {["Category","Budget","Actual"].map((h, i) => (
                    <div key={h} style={{ fontSize: 11, color: "#8a9e8a", fontWeight: "600", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
                  ))}
                </div>
                {INCOME_ROWS.map(row => (
                  <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px", padding: "5px 0", borderBottom: "1px solid #f9f7f2" }}>
                    <div style={{ fontSize: 12, color: "#2d4a3e" }}>{row.name}</div>
                    <div style={{ textAlign: "right", fontSize: 12, color: "#5a6b5a" }}>${fmt(budgets[row.id] || 0)}</div>
                    <div style={{ textAlign: "right", fontSize: 12, color: "#4caf84" }}>{actuals[row.id] ? `$${fmt(actuals[row.id])}` : "—"}</div>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px", padding: "8px 0", borderTop: "2px solid #e8e4da", marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: "700", color: "#2d4a3e" }}>Total</div>
                  <div style={{ textAlign: "right", fontSize: 12, fontWeight: "700", color: "#2d4a3e" }}>${fmt(totalIncomeBudget)}</div>
                  <div style={{ textAlign: "right", fontSize: 12, fontWeight: "700", color: "#4caf84" }}>${fmt(totalIncomeActual)}</div>
                </div>
              </>}

              {sidebarTab === "expenses" && <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px", marginBottom: 8 }}>
                  {["Category","Budget","Actual"].map((h, i) => (
                    <div key={h} style={{ fontSize: 11, color: "#8a9e8a", fontWeight: "600", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
                  ))}
                </div>
                {expenseGroups.map(group => {
                  const gb = group.rows.reduce((s, r) => s + (budgets[r.id] || 0), 0)
                  const ga = group.rows.reduce((s, r) => s + (actuals[r.id] || 0), 0)
                  return (
                    <div key={group.id} style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px", padding: "5px 0", borderBottom: "1px solid #f9f7f2" }}>
                      <div style={{ fontSize: 12, color: "#2d4a3e" }}>{group.name}</div>
                      <div style={{ textAlign: "right", fontSize: 12, color: "#5a6b5a" }}>${fmt(gb)}</div>
                      <div style={{ textAlign: "right", fontSize: 12, color: ga > gb ? "#e07070" : "#5a6b5a" }}>{ga > 0 ? `$${fmt(ga)}` : "—"}</div>
                    </div>
                  )
                })}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 55px 55px", padding: "8px 0", borderTop: "2px solid #e8e4da", marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: "700", color: "#2d4a3e" }}>Total</div>
                  <div style={{ textAlign: "right", fontSize: 12, fontWeight: "700", color: "#2d4a3e" }}>${fmt(totalExpenseBudget)}</div>
                  <div style={{ textAlign: "right", fontSize: 12, fontWeight: "700", color: totalExpenseActual > totalExpenseBudget ? "#e07070" : "#5a6b5a" }}>
                    {totalExpenseActual > 0 ? `$${fmt(totalExpenseActual)}` : "—"}
                  </div>
                </div>
              </>}

            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: "fixed", bottom: 0, left: 260, right: 0, zIndex: 20,
        background: "#2d4a3e", padding: "14px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.15)",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#a8d0be", textTransform: "uppercase", letterSpacing: "0.06em" }}>Left to Budget</div>
          <div style={{ fontSize: 22, fontWeight: "700", color: "#c8e6c9" }}>${fmt(leftToBudget)}</div>
        </div>
        <div style={{ display: "flex", gap: 48 }}>
          {[
            { label: "Budgeted Income",   value: totalIncomeBudget   },
            { label: "Budgeted Expenses", value: totalExpenseBudget  },
            { label: "Actual Spent",      value: totalExpenseActual  },
          ].map(item => (
            <div key={item.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#a8d0be" }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: "600", color: "#c8e6c9" }}>${fmt(item.value)}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Budget
