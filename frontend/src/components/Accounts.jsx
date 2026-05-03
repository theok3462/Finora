import { useState } from "react"
import { Landmark, PiggyBank, CreditCard, BarChart3, RefreshCw, Plus, ChevronDown, ChevronRight, X, Trash2 } from "lucide-react"
import { accounts as INITIAL_ACCOUNTS } from "../data"

const TYPE_CONFIG = {
  checking: { label: "Cash & Checking", icon: Landmark, color: "#4caf84", bg: "#edf7f2", order: 0 },
  savings:  { label: "Savings",          icon: PiggyBank,  color: "#5b8fd4", bg: "#eef4fb", order: 1 },
  credit:   { label: "Credit Cards",     icon: CreditCard, color: "#e07070", bg: "#fdf0f0", order: 2 },
  investment:{ label: "Investments",     icon: BarChart3,  color: "#f0a070", bg: "#fef5ed", order: 3 },
}

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n))

function AccountRow({ account, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const cfg = TYPE_CONFIG[account.type]
  const Icon = cfg.icon
  const isNegative = account.balance < 0

  const rowBg = confirming ? "#fdf6f6" : hovered ? "#fafcff" : "transparent"

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "16px 20px",
        borderBottom: "1px solid #f9f7f2",
        background: rowBg,
        transition: "background 0.15s",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirming(false) }}
    >
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={19} color={cfg.color} />
      </div>

      {/* Name + institution */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: "600", color: "#2d4a3e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {account.institution} {account.name}
        </div>
        <div style={{ fontSize: 12, color: "#5a6b5a", marginTop: 2 }}>
          {account.institution} ···· {account.lastFour}
        </div>
      </div>

      {confirming ? (
        /* Inline confirmation — replaces type badge + balance when active */
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: "#5a6b5a" }}>Remove this account?</span>
          <button
            onClick={() => onDelete(account.id)}
            style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: "600",
              border: "none", background: "#e07070", color: "#fff", cursor: "pointer",
            }}
          >
            Confirm
          </button>
          <button
            onClick={e => { e.stopPropagation(); setConfirming(false) }}
            style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: "600",
              border: "1.5px solid #e8e4da", background: "#fff", color: "#5a6b5a", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {/* Type badge */}
          <div style={{
            fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em",
            padding: "3px 9px", borderRadius: 20,
            background: cfg.bg, color: cfg.color,
            flexShrink: 0,
          }}>
            {account.type}
          </div>

          {/* Balance + synced */}
          <div style={{ textAlign: "right", flexShrink: 0, minWidth: 110 }}>
            <div style={{ fontSize: 15, fontWeight: "700", color: isNegative ? "#e07070" : "#2d4a3e" }}>
              {isNegative ? "-" : ""}{fmt(account.balance)}
            </div>
            <div style={{ fontSize: 11, color: "#a0afc0", marginTop: 2, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <RefreshCw size={10} />
              {account.synced}
            </div>
          </div>

          {/* Trash button — visible on row hover */}
          <button
            onClick={() => setConfirming(true)}
            style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              border: "none", background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#c0ccd8",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.15s, color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
            onMouseLeave={e => e.currentTarget.style.color = "#c0ccd8"}
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  )
}

function AccountGroup({ typeKey, groupAccounts, onDelete }) {
  const [open, setOpen] = useState(true)
  const cfg = TYPE_CONFIG[typeKey]
  const groupTotal = groupAccounts.reduce((s, a) => s + a.balance, 0)
  const isLiability = typeKey === "credit"

  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16, overflow: "hidden" }}>
      {/* Group header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px", cursor: "pointer",
          borderBottom: open ? "1px solid #f9f7f2" : "none",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#fafcff"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {open
          ? <ChevronDown size={16} color="#5a6b5a" />
          : <ChevronRight size={16} color="#5a6b5a" />
        }
        <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", flex: 1 }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: 13, color: "#5a6b5a", marginRight: 8 }}>
          {groupAccounts.length} account{groupAccounts.length !== 1 ? "s" : ""}
        </div>
        <div style={{
          fontSize: 15, fontWeight: "700",
          color: isLiability ? "#e07070" : "#2d4a3e",
          minWidth: 110, textAlign: "right",
        }}>
          {groupTotal < 0 ? "-" : ""}{fmt(groupTotal)}
        </div>
      </div>

      {/* Account rows */}
      {open && groupAccounts.map(a => <AccountRow key={a.id} account={a} onDelete={onDelete} />)}
    </div>
  )
}

const EMPTY_FORM = { name: "", institution: "", type: "checking", balance: "", lastFour: "" }

function AddAccountModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name = "Required"
    if (!form.institution.trim()) e.institution = "Required"
    if (form.balance === "" || isNaN(Number(form.balance))) e.balance = "Enter a valid number"
    if (form.lastFour && !/^\d{1,4}$/.test(form.lastFour)) e.lastFour = "Digits only, max 4"
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onAdd({
      id: Date.now(),
      name: form.name.trim(),
      institution: form.institution.trim(),
      type: form.type,
      balance: Number(form.balance),
      lastFour: form.lastFour || "0000",
      synced: "Just now",
    })
    onClose()
  }

  const labelStyle = { fontSize: 12, fontWeight: "600", color: "#2d4a3e", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" }
  const inputStyle = (hasErr) => ({
    width: "100%", boxSizing: "border-box",
    padding: "10px 12px", borderRadius: 8, fontSize: 14,
    border: `1.5px solid ${hasErr ? "#e07070" : "#e8e4da"}`,
    outline: "none", color: "#2d4a3e", background: "#fff",
    fontFamily: "inherit",
  })
  const errStyle = { fontSize: 11, color: "#e07070", marginTop: 4 }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{
        background: "#fff", borderRadius: 18,
        padding: "32px 32px 28px",
        width: 460, maxWidth: "calc(100vw - 40px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        position: "relative",
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: "absolute", top: 18, right: 18,
          width: 32, height: 32, borderRadius: "50%",
          border: "none", background: "#f9f7f2", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#5a6b5a",
        }}>
          <X size={16} />
        </button>

        <div style={{ fontSize: 18, fontWeight: "700", color: "#2d4a3e", marginBottom: 24 }}>
          Add Account
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Row: Name + Institution */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Account Name</label>
              <input
                style={inputStyle(errors.name)}
                placeholder="e.g. Checking"
                value={form.name}
                onChange={e => set("name", e.target.value)}
              />
              {errors.name && <div style={errStyle}>{errors.name}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Institution</label>
              <input
                style={inputStyle(errors.institution)}
                placeholder="e.g. Chase"
                value={form.institution}
                onChange={e => set("institution", e.target.value)}
              />
              {errors.institution && <div style={errStyle}>{errors.institution}</div>}
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label style={labelStyle}>Account Type</label>
            <select
              style={{ ...inputStyle(false), appearance: "none", cursor: "pointer" }}
              value={form.type}
              onChange={e => set("type", e.target.value)}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          {/* Row: Balance + Last 4 */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Current Balance</label>
              <input
                style={inputStyle(errors.balance)}
                type="number"
                placeholder="0.00"
                value={form.balance}
                onChange={e => set("balance", e.target.value)}
              />
              {errors.balance
                ? <div style={errStyle}>{errors.balance}</div>
                : <div style={{ fontSize: 11, color: "#8a9e8a", marginTop: 4 }}>Use negative for credit balances</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Last 4 Digits</label>
              <input
                style={inputStyle(errors.lastFour)}
                placeholder="e.g. 1234"
                maxLength={4}
                value={form.lastFour}
                onChange={e => set("lastFour", e.target.value.replace(/\D/g, ""))}
              />
              {errors.lastFour && <div style={errStyle}>{errors.lastFour}</div>}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 28 }}>
          <button onClick={onClose} style={{
            padding: "10px 20px", borderRadius: 9, fontSize: 14, fontWeight: "600",
            border: "1.5px solid #e8e4da", background: "#fff", color: "#5a6b5a",
            cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={{
            padding: "10px 22px", borderRadius: 9, fontSize: 14, fontWeight: "600",
            border: "none", background: "#2d4a3e", color: "#c8e6c9",
            cursor: "pointer",
          }}>
            Add Account
          </button>
        </div>
      </div>
    </div>
  )
}

function Accounts() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS)
  const [showModal, setShowModal] = useState(false)

  const addAccount = (acct) => setAccounts(prev => [...prev, acct])
  const deleteAccount = (id) => setAccounts(prev => prev.filter(a => a.id !== id))

  const totalAssets = accounts
    .filter(a => a.balance > 0)
    .reduce((s, a) => s + a.balance, 0)

  const totalLiabilities = accounts
    .filter(a => a.balance < 0)
    .reduce((s, a) => s + Math.abs(a.balance), 0)

  const netWorth = totalAssets - totalLiabilities

  const grouped = Object.keys(TYPE_CONFIG)
    .sort((a, b) => TYPE_CONFIG[a].order - TYPE_CONFIG[b].order)
    .map(key => ({ key, items: accounts.filter(a => a.type === key) }))
    .filter(g => g.items.length > 0)

  const statCard = (label, value, valueColor) => (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flex: 1,
    }}>
      <div style={{ fontSize: 12, fontWeight: "600", color: "#5a6b5a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: "700", color: valueColor || "#2d4a3e" }}>
        {value}
      </div>
    </div>
  )

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>

      {showModal && <AddAccountModal onClose={() => setShowModal(false)} onAdd={addAccount} />}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", margin: 0 }}>Accounts</h1>
        <button onClick={() => setShowModal(true)} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 10,
          background: "#2d4a3e", color: "#c8e6c9",
          border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: "600",
        }}>
          <Plus size={15} /> Add Account
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        {statCard("Total Assets", fmt(totalAssets), "#2d4a3e")}
        {statCard("Total Liabilities", fmt(totalLiabilities), "#e07070")}
        {statCard("Net Worth", fmt(netWorth), "#4caf84")}
      </div>

      {/* Account groups */}
      {grouped.map(g => (
        <AccountGroup key={g.key} typeKey={g.key} groupAccounts={g.items} onDelete={deleteAccount} />
      ))}
    </div>
  )
}

export default Accounts
