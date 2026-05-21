import { describe, it, expect } from 'vitest'
import { simplifyDebts, settlementProgress, myBalance, formatKRW, formatKRWFull } from './debt.js'

// Helper: build a minimal expense object
function expense({ id = 'e1', paidBy, amount, split, payments = [] }) {
  return { id, paidBy, amount, split, payments, status: 'unsettled' }
}

// ─── simplifyDebts ────────────────────────────────────────────────────────────

describe('simplifyDebts', () => {
  it('returns empty array when there are no expenses', () => {
    expect(simplifyDebts([], ['me', 'jihoon'])).toEqual([])
  })

  it('two people: payer gets reimbursed half', () => {
    // me paid ₩10,000 split equally → jihoon owes me ₩5,000
    const expenses = [expense({ paidBy: 'me', amount: 10000, split: { me: 5000, jihoon: 5000 } })]
    const transfers = simplifyDebts(expenses, ['me', 'jihoon'])
    expect(transfers).toEqual([{ from: 'jihoon', to: 'me', amount: 5000 }])
  })

  it('three people: both non-payers owe the payer', () => {
    // me paid ₩30,000, split 3 ways (₩10,000 each)
    const expenses = [expense({ paidBy: 'me', amount: 30000, split: { me: 10000, jihoon: 10000, soyeon: 10000 } })]
    const transfers = simplifyDebts(expenses, ['me', 'jihoon', 'soyeon'])
    expect(transfers).toHaveLength(2)
    expect(transfers).toContainEqual({ from: 'jihoon', to: 'me', amount: 10000 })
    expect(transfers).toContainEqual({ from: 'soyeon', to: 'me', amount: 10000 })
  })

  it('two expenses, different payers: only net debt transferred', () => {
    // me paid ₩20,000 split equally (me+jihoon) → jihoon owes me ₩10,000
    // jihoon paid ₩10,000 split equally (me+jihoon) → me owes jihoon ₩5,000
    // Net: jihoon owes me ₩5,000
    const expenses = [
      expense({ id: 'e1', paidBy: 'me',     amount: 20000, split: { me: 10000, jihoon: 10000 } }),
      expense({ id: 'e2', paidBy: 'jihoon', amount: 10000, split: { me: 5000,  jihoon: 5000  } }),
    ]
    const transfers = simplifyDebts(expenses, ['me', 'jihoon'])
    expect(transfers).toEqual([{ from: 'jihoon', to: 'me', amount: 5000 }])
  })

  it('all square: no transfers when everyone pays their own share', () => {
    const expenses = [
      expense({ id: 'e1', paidBy: 'me',     amount: 10000, split: { me: 10000, jihoon: 0 } }),
      expense({ id: 'e2', paidBy: 'jihoon', amount: 10000, split: { me: 0,     jihoon: 10000 } }),
    ]
    const transfers = simplifyDebts(expenses, ['me', 'jihoon'])
    expect(transfers).toEqual([])
  })

  it('settlement clears a debt fully', () => {
    const expenses = [expense({ paidBy: 'me', amount: 10000, split: { me: 5000, jihoon: 5000 } })]
    const settlements = [{ from: 'jihoon', to: 'me', amount: 5000 }]
    const transfers = simplifyDebts(expenses, ['me', 'jihoon'], settlements)
    expect(transfers).toEqual([])
  })

  it('partial settlement reduces the remaining debt', () => {
    const expenses = [expense({ paidBy: 'me', amount: 10000, split: { me: 5000, jihoon: 5000 } })]
    const settlements = [{ from: 'jihoon', to: 'me', amount: 2000 }]
    const transfers = simplifyDebts(expenses, ['me', 'jihoon'], settlements)
    expect(transfers).toEqual([{ from: 'jihoon', to: 'me', amount: 3000 }])
  })

  it('minimises transfers: 3 debtors, 1 creditor → 3 transfers not 6', () => {
    // me paid ₩60,000, split 4 ways (₩15,000 each)
    const expenses = [expense({
      paidBy: 'me', amount: 60000,
      split: { me: 15000, jihoon: 15000, soyeon: 15000, minjae: 15000 },
    })]
    const transfers = simplifyDebts(expenses, ['me', 'jihoon', 'soyeon', 'minjae'])
    expect(transfers).toHaveLength(3)
    transfers.forEach(t => expect(t.to).toBe('me'))
    transfers.forEach(t => expect(t.amount).toBe(15000))
  })

  it('ignores members not in the members list', () => {
    // expense references 'ghost' who is not in members
    const expenses = [expense({ paidBy: 'me', amount: 10000, split: { me: 5000, ghost: 5000 } })]
    // ghost is not in members → their share is simply untracked, me keeps full credit
    const transfers = simplifyDebts(expenses, ['me'])
    // me paid ₩10,000 and owes ₩5,000 of their own share → net +5,000 credit, but no one to receive from
    expect(transfers).toEqual([])
  })
})

// ─── settlementProgress ──────────────────────────────────────────────────────

describe('settlementProgress', () => {
  it('returns 100 when there are no expenses', () => {
    expect(settlementProgress([], ['me', 'jihoon'])).toBe(100)
  })

  it('returns 0 when nothing has been settled', () => {
    const expenses = [expense({ paidBy: 'me', amount: 10000, split: { me: 5000, jihoon: 5000 } })]
    expect(settlementProgress(expenses, ['me', 'jihoon'], [])).toBe(0)
  })

  it('returns 100 when fully settled via settlements', () => {
    const expenses = [expense({ paidBy: 'me', amount: 10000, split: { me: 5000, jihoon: 5000 } })]
    const settlements = [{ from: 'jihoon', to: 'me', amount: 5000 }]
    expect(settlementProgress(expenses, ['me', 'jihoon'], settlements)).toBe(100)
  })

  it('returns 50 when half the debt is settled', () => {
    const expenses = [expense({ paidBy: 'me', amount: 10000, split: { me: 5000, jihoon: 5000 } })]
    const settlements = [{ from: 'jihoon', to: 'me', amount: 2500 }]
    expect(settlementProgress(expenses, ['me', 'jihoon'], settlements)).toBe(50)
  })

  it('returns 100 when payer is also the sole member (no debt possible)', () => {
    const expenses = [expense({ paidBy: 'me', amount: 10000, split: { me: 10000 } })]
    expect(settlementProgress(expenses, ['me'], [])).toBe(100)
  })

  it('multiple expenses: progress is amount-based not expense-count-based', () => {
    // Expense 1: ₩8,000 debt;  Expense 2: ₩2,000 debt → total ₩10,000
    const expenses = [
      expense({ id: 'e1', paidBy: 'me', amount: 16000, split: { me: 8000, jihoon: 8000 } }),
      expense({ id: 'e2', paidBy: 'me', amount: 4000,  split: { me: 2000, jihoon: 2000 } }),
    ]
    // Settle the big one → 8000/10000 = 80%
    const settlements = [{ from: 'jihoon', to: 'me', amount: 8000 }]
    expect(settlementProgress(expenses, ['me', 'jihoon'], settlements)).toBe(80)
  })
})

// ─── myBalance ───────────────────────────────────────────────────────────────

describe('myBalance', () => {
  it('returns zero for both when transfers list is empty', () => {
    expect(myBalance([], 'me')).toEqual({ owed: 0, owedTo: 0 })
  })

  it('sums up what I owe', () => {
    const transfers = [
      { from: 'me', to: 'jihoon', amount: 5000 },
      { from: 'me', to: 'soyeon', amount: 3000 },
    ]
    expect(myBalance(transfers, 'me')).toEqual({ owed: 8000, owedTo: 0 })
  })

  it('sums up what others owe me', () => {
    const transfers = [
      { from: 'jihoon', to: 'me', amount: 5000 },
      { from: 'soyeon', to: 'me', amount: 3000 },
    ]
    expect(myBalance(transfers, 'me')).toEqual({ owed: 0, owedTo: 8000 })
  })

  it('handles mixed: I owe some, others owe me some', () => {
    const transfers = [
      { from: 'me',     to: 'jihoon', amount: 4000 },
      { from: 'soyeon', to: 'me',     amount: 6000 },
    ]
    expect(myBalance(transfers, 'me')).toEqual({ owed: 4000, owedTo: 6000 })
  })

  it('ignores transfers that do not involve me', () => {
    const transfers = [{ from: 'jihoon', to: 'soyeon', amount: 10000 }]
    expect(myBalance(transfers, 'me')).toEqual({ owed: 0, owedTo: 0 })
  })
})

// ─── formatKRW ───────────────────────────────────────────────────────────────

describe('formatKRW', () => {
  it('formats amounts under ₩10,000 with comma', () => {
    expect(formatKRW(5000)).toBe('₩5,000')
    expect(formatKRW(9999)).toBe('₩9,999')
  })

  it('formats exact multiples of 만 (10,000) with 만 suffix', () => {
    expect(formatKRW(10000)).toBe('₩1만')
    expect(formatKRW(20000)).toBe('₩2만')
    expect(formatKRW(100000)).toBe('₩10만')
  })

  it('falls back to comma format for non-만-multiples over ₩10,000', () => {
    expect(formatKRW(15000)).toBe('₩15,000')
    expect(formatKRW(123456)).toBe('₩123,456')
  })
})

// ─── formatKRWFull ───────────────────────────────────────────────────────────

describe('formatKRWFull', () => {
  it('always uses comma format regardless of size', () => {
    expect(formatKRWFull(5000)).toBe('₩5,000')
    expect(formatKRWFull(10000)).toBe('₩10,000')
    expect(formatKRWFull(189000)).toBe('₩189,000')
    expect(formatKRWFull(1000000)).toBe('₩1,000,000')
  })
})
