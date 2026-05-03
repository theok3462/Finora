import { useState, useMemo, useRef, useEffect } from "react"
import axios from "axios"
import {
  Trash2, PlusCircle, Search, X, Calendar, SlidersHorizontal,
  ArrowUpDown, Download, Check, Columns2,
} from "lucide-react"
import { CATEGORY_GROUPS, SUBCATEGORY_TO_GROUP } from "../data"

import API from "../api"

// ─── Date utilities ────────────────────────────────────────────────────────────

function toISO(d) { return d.toISOString().slice(0, 10) }

function getPresetRange(preset) {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth()
  const ago = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d }
  switch (preset) {
    case "last7":     return { start: toISO(ago(6)),                     end: toISO(now) }
    case "last14":    return { start: toISO(ago(13)),                    end: toISO(now) }
    case "last30":    return { start: toISO(ago(29)),                    end: toISO(now) }
    case "thisMonth": return { start: toISO(new Date(y, m, 1)),          end: toISO(new Date(y, m + 1, 0)) }
    case "lastMonth": return { start: toISO(new Date(y, m - 1, 1)),      end: toISO(new Date(y, m, 0)) }
    case "thisYear":  return { start: `${y}-01-01`,                      end: `${y}-12-31` }
    case "lastYear":  return { start: `${y - 1}-01-01`,                  end: `${y - 1}-12-31` }
    default:          return { start: "", end: "" }
  }
}

// ─── CSV export ────────────────────────────────────────────────────────────────

function runDownloadCSV(transactions, visibleColumns) {
  const cols = [
    { key: "title",            label: "Title"    },
    ...(visibleColumns.category ? [{ key: "category", label: "Category" }] : []),
    ...(visibleColumns.account  ? [{ key: "account",  label: "Account"  }] : []),
    { key: "date",             label: "Date"     },
    { key: "transaction_type", label: "Type"     },
    { key: "amount",           label: "Amount"   },
    { key: "note",             label: "Note"     },
  ]
  const esc  = v => `"${String(v ?? "").replace(/"/g, '""')}"`
  const rows = [
    cols.map(c => esc(c.label)).join(","),
    ...transactions.map(t =>
      cols.map(c => esc(c.key === "account" ? "—" : (t[c.key] ?? ""))).join(",")
    ),
  ]
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" })),
    download: "transactions.csv",
  })
  a.click()
}

// ─── Shared style helpers ──────────────────────────────────────────────────────

const btn = (active) => ({
  display: "flex", alignItems: "center", gap: 6,
  padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: "600",
  border: active ? "none" : "1px solid #e8e4da",
  background: active ? "#2d4a3e" : "#fff",
  color: active ? "#c8e6c9" : "#5a6b5a",
  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
})

// ─── Constants ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "date-desc",   label: "Date (new to old)"   },
  { value: "date-asc",    label: "Date (old to new)"   },
  { value: "amount-desc", label: "Amount (high to low)" },
  { value: "amount-asc",  label: "Amount (low to high)" },
]
const DATE_PRESETS = [
  { value: "last7",     label: "Last 7 days"  },
  { value: "last14",    label: "Last 14 days" },
  { value: "last30",    label: "Last 30 days" },
  { value: "thisMonth", label: "This month"   },
  { value: "lastMonth", label: "Last month"   },
  { value: "thisYear",  label: "This year"    },
  { value: "lastYear",  label: "Last year"    },
]

// ─── DateRangePanel ────────────────────────────────────────────────────────────

function DateRangePanel({ initialRange, onApply, onClose }) {
  const [range,       setRange]       = useState(initialRange)
  const [activePreset,setActivePreset] = useState(null)

  const applyPreset = (p) => { setActivePreset(p); setRange(getPresetRange(p)) }
  const handleClear = () => { onApply({ start: "", end: "" }); onClose() }
  const handleApply = () => { onApply(range); onClose() }

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "8px 10px", borderRadius: 8, border: "1px solid #e8e4da",
    fontSize: 13, color: "#2d4a3e", outline: "none", fontFamily: "inherit",
  }
  const labelStyle = {
    fontSize: 11, fontWeight: "600", color: "#8a9e8a",
    textTransform: "uppercase", letterSpacing: "0.05em",
    display: "block", marginBottom: 6,
  }

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300,
      background: "#fff", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
      border: "1px solid #e8e4da", width: 500, display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", flex: 1 }}>

        {/* Presets */}
        <div style={{ width: 170, borderRight: "1px solid #f9f7f2", padding: "10px 0" }}>
          {DATE_PRESETS.map(p => (
            <div key={p.value} onClick={() => applyPreset(p.value)}
              style={{
                padding: "9px 18px", fontSize: 13, cursor: "pointer",
                color: activePreset === p.value ? "#2d4a3e" : "#5a6b5a",
                fontWeight: activePreset === p.value ? "600" : "400",
                background: activePreset === p.value ? "#f0f5f2" : "transparent",
              }}
              onMouseEnter={e => { if (activePreset !== p.value) e.currentTarget.style.background = "#f9f7f2" }}
              onMouseLeave={e => { if (activePreset !== p.value) e.currentTarget.style.background = "transparent" }}
            >
              {p.label}
            </div>
          ))}
        </div>

        {/* Custom date inputs */}
        <div style={{ flex: 1, padding: "18px 18px 0" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Start Date</label>
            <input type="date" value={range.start} style={inputStyle}
              onChange={e => { setRange(r => ({ ...r, start: e.target.value })); setActivePreset(null) }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>End Date</label>
            <input type="date" value={range.end} style={inputStyle}
              onChange={e => { setRange(r => ({ ...r, end: e.target.value })); setActivePreset(null) }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderTop: "1px solid #f9f7f2" }}>
        <button onClick={handleClear} style={{ ...btn(false), color: "#e07070", borderColor: "#f9d0d0" }}>Clear</button>
        <button onClick={onClose}    style={btn(false)}>Cancel</button>
        <button onClick={handleApply} style={btn(true)}>Apply</button>
      </div>
    </div>
  )
}

// ─── FiltersModal ──────────────────────────────────────────────────────────────

function FiltersModal({ transactions, initialFilters, onApply, onClose }) {
  const [group,      setGroup]      = useState("Categories")
  const [filters,    setFilters]    = useState({
    categories: new Set(initialFilters.categories),
    merchants:  new Set(initialFilters.merchants),
    amountMin:  initialFilters.amountMin ?? "",
    amountMax:  initialFilters.amountMax ?? "",
  })
  const [catSearch,   setCatSearch]   = useState("")
  const [merchSearch, setMerchSearch] = useState("")

  const allMerchants   = useMemo(() => [...new Set(transactions.map(t => t.title))].sort(), [transactions])
  const allCatLabels   = useMemo(() => CATEGORY_GROUPS.flatMap(g => g.items.map(i => i.label)), [])

  const toggleCat  = (l) => setFilters(f => { const s = new Set(f.categories); s.has(l) ? s.delete(l) : s.add(l); return { ...f, categories: s } })
  const toggleMerc = (m) => setFilters(f => { const s = new Set(f.merchants);  s.has(m) ? s.delete(m) : s.add(m); return { ...f, merchants:  s } })

  const allCatsChecked = allCatLabels.length > 0 && allCatLabels.every(l => filters.categories.has(l))
  const allMercChecked = allMerchants.length > 0 && allMerchants.every(m => filters.merchants.has(m))

  const filteredCatGroups = CATEGORY_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => !catSearch || i.label.toLowerCase().includes(catSearch.toLowerCase())) }))
    .filter(g => g.items.length > 0)

  const filteredMerchants = allMerchants.filter(m =>
    !merchSearch || m.toLowerCase().includes(merchSearch.toLowerCase())
  )

  const totalActive =
    filters.categories.size + filters.merchants.size +
    (filters.amountMin || filters.amountMax ? 1 : 0)

  const handleApply = () => {
    onApply({
      categories: [...filters.categories],
      merchants:  [...filters.merchants],
      amountMin:  filters.amountMin,
      amountMax:  filters.amountMax,
    })
    onClose()
  }
  const handleClearAll = () => {
    onApply({ categories: [], merchants: [], amountMin: "", amountMax: "" })
    onClose()
  }

  const inputS = {
    width: "100%", boxSizing: "border-box", padding: "7px 10px", borderRadius: 8,
    border: "1px solid #e8e4da", fontSize: 13, outline: "none", fontFamily: "inherit",
  }

  const renderCenter = () => {
    if (group === "Categories") return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f9f7f2" }}>
          <input value={catSearch} onChange={e => setCatSearch(e.target.value)}
            placeholder="Search categories…" style={inputS} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px 4px", cursor: "pointer" }}>
          <input type="checkbox" checked={allCatsChecked} style={{ accentColor: "#2d4a3e", cursor: "pointer" }}
            onChange={() => setFilters(f => ({ ...f, categories: allCatsChecked ? new Set() : new Set(allCatLabels) }))} />
          <span style={{ fontSize: 13, fontWeight: "600", color: "#2d4a3e" }}>Select all</span>
        </label>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 16px" }}>
          {filteredCatGroups.map(g => (
            <div key={g.group} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: "700", color: "#8a9e8a", textTransform: "uppercase", letterSpacing: "0.07em", padding: "6px 0 4px" }}>
                {g.group}
              </div>
              {g.items.map(item => (
                <label key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0 5px 12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={filters.categories.has(item.label)}
                    onChange={() => toggleCat(item.label)}
                    style={{ accentColor: "#2d4a3e", cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#2d4a3e" }}>{item.label}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
    )

    if (group === "Merchants") return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f9f7f2" }}>
          <input value={merchSearch} onChange={e => setMerchSearch(e.target.value)}
            placeholder="Search merchants…" style={inputS} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px 4px", cursor: "pointer" }}>
          <input type="checkbox" checked={allMercChecked} style={{ accentColor: "#2d4a3e", cursor: "pointer" }}
            onChange={() => setFilters(f => ({ ...f, merchants: allMercChecked ? new Set() : new Set(allMerchants) }))} />
          <span style={{ fontSize: 13, fontWeight: "600", color: "#2d4a3e" }}>Select all</span>
        </label>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 16px" }}>
          {filteredMerchants.map(m => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={filters.merchants.has(m)}
                onChange={() => toggleMerc(m)}
                style={{ accentColor: "#2d4a3e", cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#2d4a3e" }}>{m}</span>
            </label>
          ))}
          {filteredMerchants.length === 0 && <div style={{ fontSize: 13, color: "#8a9e8a", padding: "10px 0" }}>No merchants found</div>}
        </div>
      </div>
    )

    if (group === "Amount") return (
      <div style={{ padding: 20 }}>
        {[["Min Amount ($)", "amountMin", "0.00"], ["Max Amount ($)", "amountMax", "no limit"]].map(([label, key, ph]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: "600", color: "#8a9e8a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
            <input type="number" value={filters[key]} placeholder={ph} style={inputS}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))} />
          </div>
        ))}
      </div>
    )

    return <div style={{ padding: 32, textAlign: "center", color: "#8a9e8a", fontSize: 13 }}>Coming soon</div>
  }

  const sideGroups = ["Categories", "Merchants", "Accounts", "Tags", "Goals", "Amount", "Other"]
  const badgeFor   = { Categories: filters.categories.size, Merchants: filters.merchants.size }

  return (
    <>
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.45)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 401, background: "#fff", borderRadius: 16,
        width: 700, maxWidth: "calc(100vw - 40px)",
        height: 520, maxHeight: "calc(100vh - 80px)",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f9f7f2" }}>
          <div style={{ fontSize: 16, fontWeight: "700", color: "#2d4a3e" }}>
            Filters
            {totalActive > 0 && <span style={{ fontSize: 12, fontWeight: "600", color: "#5b8fd4", marginLeft: 8 }}>({totalActive} active)</span>}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#f9f7f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a6b5a" }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Left nav */}
          <div style={{ width: 158, borderRight: "1px solid #f9f7f2", padding: "10px 0", overflowY: "auto", flexShrink: 0 }}>
            {sideGroups.map(g => (
              <div key={g} onClick={() => setGroup(g)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 16px", fontSize: 13, cursor: "pointer",
                  color: group === g ? "#2d4a3e" : "#5a6b5a",
                  fontWeight: group === g ? "600" : "400",
                  background: group === g ? "#f0f5f2" : "transparent",
                  borderLeft: `3px solid ${group === g ? "#2d4a3e" : "transparent"}`,
                }}
              >
                {g}
                {badgeFor[g] > 0 && (
                  <span style={{ fontSize: 11, fontWeight: "700", color: "#5b8fd4" }}>{badgeFor[g]}</span>
                )}
              </div>
            ))}
          </div>

          {/* Center content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {renderCenter()}
          </div>

          {/* Right: selected summary */}
          <div style={{ width: 192, borderLeft: "1px solid #f9f7f2", padding: "14px 14px", overflowY: "auto", flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: "700", color: "#8a9e8a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Active Filters
            </div>
            {totalActive === 0 && <div style={{ fontSize: 13, color: "#a0afc0" }}>None applied</div>}

            {filters.categories.size > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: "600", color: "#2d4a3e", marginBottom: 6 }}>
                  Categories ({filters.categories.size})
                </div>
                {[...filters.categories].map(l => (
                  <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#5a6b5a" }}>{l}</span>
                    <button onClick={() => toggleCat(l)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#a0afc0", display: "flex" }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {filters.merchants.size > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: "600", color: "#2d4a3e", marginBottom: 6 }}>
                  Merchants ({filters.merchants.size})
                </div>
                {[...filters.merchants].slice(0, 8).map(m => (
                  <div key={m} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#5a6b5a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{m}</span>
                    <button onClick={() => toggleMerc(m)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#a0afc0", display: "flex", flexShrink: 0 }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {filters.merchants.size > 8 && <div style={{ fontSize: 12, color: "#8a9e8a" }}>+{filters.merchants.size - 8} more</div>}
              </div>
            )}

            {(filters.amountMin || filters.amountMax) && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: "600", color: "#2d4a3e", marginBottom: 4 }}>Amount</div>
                <div style={{ fontSize: 12, color: "#5a6b5a" }}>
                  {filters.amountMin ? `$${filters.amountMin}` : "any"} – {filters.amountMax ? `$${filters.amountMax}` : "any"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid #f9f7f2" }}>
          <button onClick={handleClearAll} style={{ ...btn(false), color: "#e07070", borderColor: "#f9d0d0" }}>Clear All</button>
          <button onClick={onClose} style={btn(false)}>Cancel</button>
          <button onClick={handleApply} style={btn(true)}>Apply</button>
        </div>
      </div>
    </>
  )
}

// ─── SortMenu ──────────────────────────────────────────────────────────────────

function SortMenu({ value, onChange, onClose }) {
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300,
      background: "#fff", borderRadius: 10, border: "1px solid #e8e4da",
      boxShadow: "0 8px 24px rgba(0,0,0,0.11)", width: 210, padding: "6px 0", overflow: "hidden",
    }}>
      {SORT_OPTIONS.map(o => (
        <div key={o.value} onClick={() => { onChange(o.value); onClose() }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 14px", cursor: "pointer", fontSize: 13,
            color: value === o.value ? "#2d4a3e" : "#5a6b5a",
            fontWeight: value === o.value ? "600" : "400",
            background: value === o.value ? "#f0f5f2" : "transparent",
          }}
          onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = "#f9f7f2" }}
          onMouseLeave={e => { if (value !== o.value) e.currentTarget.style.background = "transparent" }}
        >
          {o.label}
          {value === o.value && <Check size={13} color="#2d4a3e" />}
        </div>
      ))}
    </div>
  )
}

// ─── ColumnsMenu ───────────────────────────────────────────────────────────────

function ColumnsMenu({ columns, onChange }) {
  const visible = Object.values(columns).filter(Boolean).length
  const total   = Object.keys(columns).length

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 300,
      background: "#fff", borderRadius: 10, border: "1px solid #e8e4da",
      boxShadow: "0 8px 24px rgba(0,0,0,0.11)", width: 220, overflow: "hidden",
    }}>
      <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid #f9f7f2" }}>
        <div style={{ fontSize: 11, fontWeight: "600", color: "#8a9e8a", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {visible} of {total} visible
        </div>
      </div>
      {Object.entries(columns).map(([key, on]) => (
        <div key={key} onClick={() => onChange({ ...columns, [key]: !on })}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", cursor: "pointer", fontSize: 13 }}
          onMouseEnter={e => e.currentTarget.style.background = "#f9f7f2"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ color: "#2d4a3e", textTransform: "capitalize" }}>{key}</span>
          <div style={{ width: 34, height: 18, borderRadius: 9, background: on ? "#2d4a3e" : "#d1d5db", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── SummaryCard ───────────────────────────────────────────────────────────────

function SummaryCard({ transactions, visibleColumns, onDownload }) {
  const fmtUSD = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  if (transactions.length === 0) return (
    <div style={{ width: 252, flexShrink: 0 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e", marginBottom: 14 }}>Summary</div>
        <div style={{ fontSize: 13, color: "#8a9e8a", textAlign: "center", padding: "16px 0" }}>No matching transactions</div>
        <button onClick={onDownload} style={{ width: "100%", marginTop: 12, padding: "8px 0", borderRadius: 8, background: "#f9f7f2", border: "1px solid #e8e4da", fontSize: 13, fontWeight: "600", color: "#2d4a3e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
          <Download size={13} /> Download CSV
        </button>
      </div>
    </div>
  )

  const expenses  = transactions.filter(t => t.transaction_type === "expense")
  const incomes   = transactions.filter(t => t.transaction_type === "income")
  const allAmts   = transactions.map(t => parseFloat(t.amount))
  const expAmts   = expenses.map(t => parseFloat(t.amount))
  const totalSpend  = expAmts.reduce((s, a) => s + a, 0)
  const totalIncome = incomes.reduce((s, t) => s + parseFloat(t.amount), 0)
  const maxTx       = Math.max(...allAmts)
  const maxExp      = expAmts.length ? Math.max(...expAmts) : 0
  const avgTx       = allAmts.reduce((s, a) => s + a, 0) / allAmts.length
  const dates       = transactions.map(t => t.date).sort()

  const stats = [
    { label: "Transactions",       value: transactions.length.toString() },
    { label: "Total Income",       value: fmtUSD(totalIncome),  color: "#4caf84" },
    { label: "Total Spending",     value: fmtUSD(totalSpend),   color: "#e07070" },
    { label: "Largest Transaction",value: fmtUSD(maxTx) },
    { label: "Largest Expense",    value: fmtUSD(maxExp) },
    { label: "Avg Transaction",    value: fmtUSD(avgTx) },
    { label: "First Transaction",  value: dates[0] },
    { label: "Last Transaction",   value: dates[dates.length - 1] },
  ]

  return (
    <div style={{ width: 252, flexShrink: 0, position: "sticky", top: 0, alignSelf: "flex-start" }}>
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f9f7f2" }}>
          <div style={{ fontSize: 14, fontWeight: "700", color: "#2d4a3e" }}>Summary</div>
          <div style={{ fontSize: 11, color: "#8a9e8a", marginTop: 2 }}>
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ padding: "4px 18px 4px" }}>
          {stats.map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f9f7f2" }}>
              <div style={{ fontSize: 12, color: "#5a6b5a", marginRight: 8 }}>{s.label}</div>
              <div style={{ fontSize: 12, fontWeight: "600", color: s.color || "#2d4a3e", maxWidth: 110, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 18px" }}>
          <button onClick={onDownload}
            style={{ width: "100%", padding: "8px 0", borderRadius: 8, background: "#f9f7f2", border: "1px solid #e8e4da", fontSize: 13, fontWeight: "600", color: "#2d4a3e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
            <Download size={13} /> Download CSV
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Transactions ──────────────────────────────────────────────────────────────

function Transactions({ transactions, form, setForm, handleSubmit, handleDelete, onUpdateTransaction }) {

  // ── Inline category edit ────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null)
  const [flashId,   setFlashId]   = useState(null)

  const handleCategoryChange = (id, newCategory) => {
    const parentCat = SUBCATEGORY_TO_GROUP[newCategory] || ""
    setEditingId(null)
    setFlashId(id)
    setTimeout(() => setFlashId(null), 1400)
    axios.patch(`${API}${id}/`, { category: newCategory, parent_category: parentCat })
      .then(res => onUpdateTransaction(id, res.data))
      .catch(err => console.error("Failed to update category:", err))
  }

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showAddForm,     setShowAddForm]     = useState(false)
  const [searchOpen,      setSearchOpen]      = useState(false)
  const [searchQuery,     setSearchQuery]     = useState("")
  const [dateOpen,        setDateOpen]        = useState(false)
  const [filtersOpen,     setFiltersOpen]     = useState(false)
  const [sortOpen,        setSortOpen]        = useState(false)
  const [columnsOpen,     setColumnsOpen]     = useState(false)

  // ── Applied filter state ────────────────────────────────────────────────────
  const [appliedDate,    setAppliedDate]    = useState({ start: "", end: "" })
  const [appliedFilters, setAppliedFilters] = useState({ categories: [], merchants: [], amountMin: "", amountMax: "" })
  const [sortOption,     setSortOption]     = useState("date-desc")
  const [visibleColumns, setVisibleColumns] = useState({ category: true, account: true })

  // ── Refs for click-outside ──────────────────────────────────────────────────
  const dateRef    = useRef(null)
  const sortRef    = useRef(null)
  const columnsRef = useRef(null)
  const searchRef  = useRef(null)

  useEffect(() => {
    const handle = (e) => {
      if (dateRef.current    && !dateRef.current.contains(e.target))                          setDateOpen(false)
      if (sortRef.current    && !sortRef.current.contains(e.target))                          setSortOpen(false)
      if (columnsRef.current && !columnsRef.current.contains(e.target))                       setColumnsOpen(false)
      if (searchRef.current  && !searchRef.current.contains(e.target) && !searchQuery.trim()) setSearchOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [searchQuery])

  // ── Filtered + sorted transactions ─────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...transactions]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      r = r.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.note?.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      )
    }

    if (appliedDate.start) r = r.filter(t => t.date >= appliedDate.start)
    if (appliedDate.end)   r = r.filter(t => t.date <= appliedDate.end)

    if (appliedFilters.categories.length > 0) {
      const allowed = new Set(appliedFilters.categories.flatMap(label => {
        for (const g of CATEGORY_GROUPS) {
          const item = g.items.find(i => i.label === label)
          if (item) return [item.value]
        }
        return [label]
      }))
      r = r.filter(t => allowed.has(t.category))
    }

    if (appliedFilters.merchants.length > 0) {
      const allowed = new Set(appliedFilters.merchants)
      r = r.filter(t => allowed.has(t.title))
    }

    if (appliedFilters.amountMin) r = r.filter(t => parseFloat(t.amount) >= parseFloat(appliedFilters.amountMin))
    if (appliedFilters.amountMax) r = r.filter(t => parseFloat(t.amount) <= parseFloat(appliedFilters.amountMax))

    r.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":   return b.date.localeCompare(a.date)
        case "date-asc":    return a.date.localeCompare(b.date)
        case "amount-desc": return parseFloat(b.amount) - parseFloat(a.amount)
        case "amount-asc":  return parseFloat(a.amount) - parseFloat(b.amount)
        default: return 0
      }
    })

    return r
  }, [transactions, searchQuery, appliedDate, appliedFilters, sortOption])

  // ── Active filter flags ─────────────────────────────────────────────────────
  const dateActive    = !!(appliedDate.start || appliedDate.end)
  const filterCount   = appliedFilters.categories.length + appliedFilters.merchants.length + (appliedFilters.amountMin || appliedFilters.amountMax ? 1 : 0)
  const filtersActive = filterCount > 0
  const colCount      = Object.values(visibleColumns).filter(Boolean).length
  const colTotal      = Object.keys(visibleColumns).length

  // ── Dynamic grid columns ───────────────────────────────────────────────────
  const activeCols = [
    { key: "title",   label: "Title",    size: "2fr"  },
    ...(visibleColumns.category ? [{ key: "category", label: "Category", size: "1fr" }] : []),
    ...(visibleColumns.account  ? [{ key: "account",  label: "Account",  size: "1fr" }] : []),
    { key: "date",    label: "Date",     size: "1fr"  },
    { key: "amount",  label: "Amount",   size: "1fr"  },
    { key: "actions", label: "",         size: "40px" },
  ]
  const gridTemplate = activeCols.map(c => c.size).join(" ")

  const sortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label ?? "Sort"

  return (
    <div style={{ width: "100%", paddingBottom: 40 }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 22, fontWeight: "700", color: "#2d4a3e", margin: 0 }}>Transactions</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

          {/* Search */}
          <div ref={searchRef} style={{ position: "relative" }}>
            {searchOpen ? (
              <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #2d4a3e", borderRadius: 8, padding: "0 10px", gap: 6 }}>
                <Search size={13} color="#5a6b5a" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Escape") { setSearchQuery(""); if (!searchQuery) setSearchOpen(false) }
                  }}
                  placeholder="Search transactions…"
                  style={{ border: "none", outline: "none", fontSize: 13, color: "#2d4a3e", width: 210, padding: "7px 0", background: "transparent", fontFamily: "inherit" }}
                />
                {searchQuery ? (
                  <button onClick={() => setSearchQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#a0afc0", display: "flex", padding: 0 }}>
                    <X size={13} />
                  </button>
                ) : (
                  <button onClick={() => setSearchOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#a0afc0", display: "flex", padding: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} style={btn(!!searchQuery)}>
                <Search size={13} />
                {searchQuery ? `"${searchQuery.slice(0, 14)}${searchQuery.length > 14 ? "…" : ""}"` : "Search"}
              </button>
            )}
          </div>

          {/* Date */}
          <div ref={dateRef} style={{ position: "relative" }}>
            <button onClick={() => setDateOpen(o => !o)} style={btn(dateActive)}>
              <Calendar size={13} /> Date{dateActive ? " ●" : ""}
            </button>
            {dateOpen && (
              <DateRangePanel
                initialRange={appliedDate}
                onApply={r => setAppliedDate(r)}
                onClose={() => setDateOpen(false)}
              />
            )}
          </div>

          {/* Filters */}
          <button onClick={() => setFiltersOpen(true)} style={btn(filtersActive)}>
            <SlidersHorizontal size={13} /> Filters{filtersActive ? ` (${filterCount})` : ""}
          </button>

          {filtersOpen && (
            <FiltersModal
              transactions={transactions}
              initialFilters={appliedFilters}
              onApply={f => setAppliedFilters(f)}
              onClose={() => setFiltersOpen(false)}
            />
          )}

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: "#e8e4da" }} />

          {/* Add Transaction */}
          <button
            onClick={() => setShowAddForm(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#2d4a3e", color: "#c8e6c9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "600", fontFamily: "inherit" }}>
            {showAddForm ? <><X size={13} /> Cancel</> : <><PlusCircle size={13} /> Add Transaction</>}
          </button>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>

        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Add transaction form */}
          {showAddForm && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 22, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 15, fontWeight: "600", color: "#2d4a3e", marginBottom: 14 }}>New Transaction</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { ph: "Title",          key: "title",            type: "text"   },
                  { ph: "Amount",         key: "amount",           type: "number" },
                  { ph: "Date",           key: "date",             type: "date"   },
                  { ph: "Note (optional)",key: "note",             type: "text"   },
                ].map(f => (
                  <input key={f.key} type={f.type} placeholder={f.ph} value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    style={{ padding: "9px 11px", borderRadius: 8, border: "1px solid #e8e4da", fontSize: 13, color: "#2d4a3e", outline: "none", fontFamily: "inherit" }} />
                ))}
                <select value={form.transaction_type}
                  onChange={e => setForm({ ...form, transaction_type: e.target.value })}
                  style={{ padding: "9px 11px", borderRadius: 8, border: "1px solid #e8e4da", fontSize: 13, color: "#2d4a3e", outline: "none", background: "#fff", fontFamily: "inherit" }}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <select value={form.category}
                  onChange={e => { const cat = e.target.value; setForm({ ...form, category: cat, parent_category: SUBCATEGORY_TO_GROUP[cat] || "" }) }}
                  style={{ padding: "9px 11px", borderRadius: 8, border: "1px solid #e8e4da", fontSize: 13, color: "#2d4a3e", outline: "none", background: "#fff", fontFamily: "inherit" }}>
                  <option value="">Select category…</option>
                  {CATEGORY_GROUPS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map(item => (
                        <option key={`${g.group}-${item.label}`} value={item.value}>{item.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <button onClick={() => { handleSubmit(); setShowAddForm(false) }}
                style={{ marginTop: 12, padding: "9px 20px", background: "#2d4a3e", color: "#c8e6c9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "600", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                <PlusCircle size={14} /> Add Transaction
              </button>
            </div>
          )}

          {/* Table controls bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#5a6b5a" }}>
              {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
              {transactions.length !== filtered.length && ` of ${transactions.length.toLocaleString()}`}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {/* Sort */}
              <div ref={sortRef} style={{ position: "relative" }}>
                <button onClick={() => setSortOpen(o => !o)} style={btn(false)}>
                  <ArrowUpDown size={13} /> {sortLabel}
                </button>
                {sortOpen && <SortMenu value={sortOption} onChange={setSortOption} onClose={() => setSortOpen(false)} />}
              </div>
              {/* Columns */}
              <div ref={columnsRef} style={{ position: "relative" }}>
                <button onClick={() => setColumnsOpen(o => !o)} style={btn(false)}>
                  <Columns2 size={13} /> Columns ({colCount}/{colTotal})
                </button>
                {columnsOpen && <ColumnsMenu columns={visibleColumns} onChange={setVisibleColumns} />}
              </div>
            </div>
          </div>

          {/* Transaction list */}
          <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

            {/* Header row */}
            <div style={{
              display: "grid", gridTemplateColumns: gridTemplate,
              padding: "9px 12px", borderBottom: "2px solid #f9f7f2",
              fontSize: 11, fontWeight: "600", color: "#5a6b5a",
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              {activeCols.map((c, i) => (
                <div key={c.key} style={{ textAlign: i > 0 && c.key !== "actions" ? (c.key === "amount" ? "right" : "left") : "left" }}>
                  {c.label}
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 24px", color: "#8a9e8a", fontSize: 14 }}>
                {transactions.length === 0 ? "No transactions yet." : "No transactions match your filters."}
              </div>
            )}

            {filtered.map((t, i) => {
              const isEditing  = editingId === t.id
              const isFlashing = flashId === t.id
              const rowBg = isFlashing ? "#eaf5ee" : i % 2 === 0 ? "#f9f7f2" : "#fff"

              return (
                <div key={t.id} style={{
                  display: "grid", gridTemplateColumns: gridTemplate,
                  padding: "11px 12px", alignItems: "center",
                  background: rowBg, transition: "background 0.4s",
                  borderBottom: "1px solid #f5f2eb",
                }}>
                  {/* Title */}
                  <div style={{ fontSize: 14, fontWeight: "500", color: "#2d4a3e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                    {t.title}
                  </div>

                  {/* Category (optional) */}
                  {visibleColumns.category && (
                    <div>
                      {isEditing ? (
                        <select autoFocus defaultValue={t.category}
                          onChange={e => handleCategoryChange(t.id, e.target.value)}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={e => e.key === "Escape" && setEditingId(null)}
                          style={{ fontSize: 12, color: "#2d4a3e", background: "#fff", border: "1.5px solid #c8e6c9", borderRadius: 8, padding: "3px 6px", outline: "none", cursor: "pointer", width: "100%", fontFamily: "inherit" }}
                        >
                          {CATEGORY_GROUPS.map(g => (
                            <optgroup key={g.group} label={g.group}>
                              {g.items.map(item => (
                                <option key={`${g.group}-${item.label}`} value={item.value}>{item.label}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      ) : (
                        <div onClick={() => setEditingId(t.id)} title="Click to change category"
                          style={{ fontSize: 12, color: "#5a6b5a", background: isFlashing ? "#c8e6c9" : "#f9f7f2", padding: "3px 8px", borderRadius: 20, display: "inline-block", width: "fit-content", cursor: "pointer", userSelect: "none", transition: "background 0.4s" }}>
                          {t.category}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account (optional) */}
                  {visibleColumns.account && (
                    <div style={{ fontSize: 13, color: "#a0afc0" }}>—</div>
                  )}

                  {/* Date */}
                  <div style={{ fontSize: 13, color: "#5a6b5a" }}>{t.date}</div>

                  {/* Amount */}
                  <div style={{ fontSize: 14, fontWeight: "600", color: t.transaction_type === "income" ? "#4caf84" : "#e07070", textAlign: "right" }}>
                    {t.transaction_type === "income" ? "+" : "-"}${t.amount}
                  </div>

                  {/* Delete */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => handleDelete(t.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#c0ccd8", padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column: Summary */}
        <SummaryCard
          transactions={filtered}
          visibleColumns={visibleColumns}
          onDownload={() => runDownloadCSV(filtered, visibleColumns)}
        />
      </div>
    </div>
  )
}

export default Transactions
