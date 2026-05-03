export const accounts = [
  { id: 1, name: "Checking",           type: "checking",   balance:  4821.50, institution: "Bank of America", lastFour: "9712", synced: "1 hour ago"   },
  { id: 2, name: "Savings",            type: "savings",    balance:  8400.00, institution: "Bank of America", lastFour: "3107", synced: "1 hour ago"   },
  { id: 3, name: "High-Yield Savings", type: "savings",    balance:  3200.00, institution: "Ally Bank",       lastFour: "0392", synced: "3 hours ago"  },
  { id: 4, name: "Active Cash Card",   type: "credit",     balance:  -843.27, institution: "Wells Fargo",     lastFour: "1214", synced: "30 min ago"   },
  { id: 5, name: "Brokerage",          type: "investment", balance:  2340.00, institution: "Robinhood",       lastFour: "5412", synced: "15 min ago"   },
]

export const netWorthHistory = [
  { month: "Jan '25", value:  4200 },
  { month: "Mar '25", value:  6050 },
  { month: "May '25", value:  8200 },
  { month: "Jul '25", value: 10500 },
  { month: "Sep '25", value: 12700 },
  { month: "Nov '25", value: 14900 },
  { month: "Jan '26", value: 16400 },
  { month: "Feb '26", value: 16950 },
  { month: "Mar '26", value: 17450 },
  { month: "Apr '26", value: 17918 },
]

export const recurringPayments = [
  // Income
  { id: 1, name: "Cabo Bobs Paycheck", amount: 1050.00, frequency: "Bi-Weekly", category: "Employment", type: "income",  dueDay: 1,  paid: true  },
  { id: 2, name: "Cabo Bobs Tips",     amount:  420.00, frequency: "Bi-Weekly", category: "Tips",       type: "income",  dueDay: 1,  paid: true  },
  // Expenses
  { id: 3, name: "Rent",               amount:  750.00, frequency: "Monthly",   category: "Housing",    type: "expense", dueDay: 1,  paid: true  },
  { id: 4, name: "Netflix",            amount:   15.99, frequency: "Monthly",   category: "Netflix",    type: "expense", dueDay: 8,  paid: true  },
  { id: 5, name: "Spotify",            amount:    9.99, frequency: "Monthly",   category: "Spotify",    type: "expense", dueDay: 8,  paid: true  },
  { id: 6, name: "ChatGPT",            amount:   20.00, frequency: "Monthly",   category: "ChatGPT",    type: "expense", dueDay: 20, paid: false },
  { id: 7, name: "Google One",         amount:    2.99, frequency: "Monthly",   category: "Google One", type: "expense", dueDay: 27, paid: false },
  { id: 8, name: "Lifetime Fitness",   amount:   49.99, frequency: "Monthly",   category: "Health",     type: "expense", dueDay: 28, paid: false },
  // Credit
  { id: 9, name: "Wells Fargo Card",   amount:  843.27, frequency: "Monthly",   category: "Credit Card", type: "credit", dueDay: 22, paid: false },
]

export const holdings = [
  { ticker: "AAPL", name: "Apple Inc.",           price: 181.00, quantity: 3, past3mo: -8.50  },
  { ticker: "TSLA", name: "Tesla Inc.",            price: 144.00, quantity: 4, past3mo: -42.50 },
  { ticker: "NVDA", name: "NVIDIA Corp.",          price: 109.00, quantity: 3, past3mo: -18.00 },
  { ticker: "AMZN", name: "Amazon.com Inc.",       price: 198.00, quantity: 3, past3mo: -10.50 },
  { ticker: "BND",  name: "Vanguard Total Bond",   price:  75.00, quantity: 4, past3mo:  -1.80 },
]

export const goals = [
  { id: 1, name: "Emergency Fund",  target: 10000, current:  8400, color: "#4caf84" },
  { id: 2, name: "Europe Trip",     target:  5000, current:  2100, color: "#5b8fd4" },
  { id: 3, name: "New MacBook Pro", target:  2500, current:  1340, color: "#f0a070" },
  { id: 4, name: "Investment Fund", target:  5000, current:  2340, color: "#9b7dd4" },
]

// Grouped category structure shared by Transactions (dropdown) and Budget (row mapping).
// `value` is the exact subcategory string stored on transactions in the database.
// label === value: each subcategory is unique and directly queryable.
export const CATEGORY_GROUPS = [
  { group: "Income", items: [
    { label: "Hourly",           value: "Hourly"           },
    { label: "Tips",             value: "Tips"             },
    { label: "Freelance",        value: "Freelance"        },
  ]},
  { group: "Housing", items: [
    { label: "Rent",             value: "Rent"             },
  ]},
  { group: "Food & Dining", items: [
    { label: "Groceries",        value: "Groceries"        },
    { label: "Dining Out",       value: "Dining Out"       },
  ]},
  { group: "Transportation", items: [
    { label: "Gas",              value: "Gas"              },
    { label: "Uber/Lyft",        value: "Uber/Lyft"        },
  ]},
  { group: "Subscriptions", items: [
    { label: "Netflix",          value: "Netflix"          },
    { label: "Spotify",          value: "Spotify"          },
    { label: "ChatGPT",          value: "ChatGPT"          },
    { label: "Google One",       value: "Google One"       },
  ]},
  { group: "Health & Fitness", items: [
    { label: "Lifetime Fitness", value: "Lifetime Fitness" },
    { label: "Supplements",      value: "Supplements"      },
  ]},
  { group: "Entertainment", items: [
    { label: "Movies",           value: "Movies"           },
    { label: "Concerts",         value: "Concerts"         },
  ]},
  { group: "Social", items: [
    { label: "Dates",            value: "Dates"            },
    { label: "Friends Night",    value: "Friends Night"    },
  ]},
  { group: "Shopping", items: [
    { label: "Shopping",         value: "Shopping"         },
    { label: "Clothes",          value: "Clothes"          },
    { label: "Home Goods",       value: "Home Goods"       },
  ]},
]

// Lookup: subcategory value → parent group name
// Used by the frontend to derive parent_category when saving/patching a transaction.
export const SUBCATEGORY_TO_GROUP = Object.fromEntries(
  CATEGORY_GROUPS.flatMap(g => g.items.map(item => [item.value, g.group]))
)
