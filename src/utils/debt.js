// Balance is computed purely from expense credits/debits + group-level settlements.
// Per-expense payments[] (old architecture) are intentionally ignored — the app
// uses group.settlements[] exclusively since the Settle Up flow was redesigned.

function computeBalance(expenses, members) {
  const balance = {}
  members.forEach(m => (balance[m] = 0))
  expenses.forEach(exp => {
    if (balance[exp.paidBy] !== undefined) balance[exp.paidBy] += exp.amount
    Object.entries(exp.split).forEach(([person, share]) => {
      if (balance[person] !== undefined) balance[person] -= share
    })
  })
  return balance
}

function applySettlements(balance, settlements) {
  settlements.forEach(s => {
    if (balance[s.from] !== undefined) balance[s.from] += s.amount
    if (balance[s.to]   !== undefined) balance[s.to]   -= s.amount
  })
}

export function simplifyDebts(expenses, members, settlements = []) {
  const balance = computeBalance(expenses, members)
  applySettlements(balance, settlements)

  const creditors = []
  const debtors   = []

  Object.entries(balance).forEach(([id, amt]) => {
    const rounded = Math.round(amt)
    if (rounded > 0) creditors.push({ id, amount: rounded })
    if (rounded < 0) debtors.push({ id, amount: -rounded })
  })

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transfers = []

  while (creditors.length > 0 && debtors.length > 0) {
    const cred = creditors[0]
    const debt = debtors[0]
    const amount = Math.min(cred.amount, debt.amount)

    if (amount > 0) transfers.push({ from: debt.id, to: cred.id, amount })

    cred.amount -= amount
    debt.amount -= amount

    if (cred.amount === 0) creditors.shift()
    if (debt.amount === 0) debtors.shift()
  }

  return transfers
}

export function settlementProgress(expenses, members, settlements = []) {
  if (expenses.length === 0) return 100
  const { totalOwed, cleared } = settlementAmounts(expenses, members, settlements)
  if (totalOwed === 0) return 100
  return Math.round((cleared / totalOwed) * 100)
}

export function settlementAmounts(expenses, members, settlements = []) {
  if (expenses.length === 0) return { totalOwed: 0, cleared: 0 }

  const balance = computeBalance(expenses, members)
  const totalOwed = Object.values(balance).filter(b => b > 0).reduce((s, b) => s + b, 0)
  if (totalOwed === 0) return { totalOwed: 0, cleared: 0 }

  applySettlements(balance, settlements)
  const remaining = Math.max(0, Object.values(balance).filter(b => b > 0).reduce((s, b) => s + b, 0))
  return { totalOwed, cleared: totalOwed - remaining }
}

export function myBalance(transfers, myId = 'me') {
  let owed = 0, owedTo = 0
  transfers.forEach(t => {
    if (t.from === myId) owed   += t.amount
    if (t.to   === myId) owedTo += t.amount
  })
  return { owed, owedTo }
}

export function formatKRW(amount) {
  if (amount >= 10000) {
    const man = amount / 10000
    return man % 1 === 0 ? `₩${man}만` : `₩${amount.toLocaleString()}`
  }
  return `₩${amount.toLocaleString()}`
}

export function formatKRWFull(amount) {
  return `₩${amount.toLocaleString()}`
}
