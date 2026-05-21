import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { INITIAL_GROUPS, USERS } from './data/seed.js'
import { simplifyDebts } from './utils/debt.js'

const STORAGE_KEY = 'split-and-settle-groups-v2'

function loadGroups() {
  try {
    localStorage.removeItem('split-and-settle-groups')
    const saved = localStorage.getItem(STORAGE_KEY)
    const groups = saved ? JSON.parse(saved) : INITIAL_GROUPS
    // Migrate existing groups to include new fields if missing
    return groups.map(g => ({
      ...g,
      settlements: g.settlements || [],
      settleRequests: g.settleRequests || [],
    }))
  } catch {
    return INITIAL_GROUPS
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [groups, setGroups] = useState(loadGroups)
  const [users] = useState(USERS)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
  }, [groups])

  const getGroup = useCallback(id => groups.find(g => g.id === id), [groups])

  const addExpense = useCallback((groupId, expense) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return { ...g, expenses: [...g.expenses, expense] }
    }))
  }, [])

  const markPaid = useCallback((groupId, transferFrom, transferTo, amount) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      const settlements = [...(g.settlements || []), {
        from: transferFrom, to: transferTo, amount,
        date: new Date().toISOString().split('T')[0],
      }]
      return { ...g, settlements }
    }))
  }, [])

  const addGroup = useCallback((group) => {
    setGroups(prev => [...prev, group])
  }, [])

  const removeGroup = useCallback((groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }, [])

  const removeExpense = useCallback((groupId, expenseId) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return { ...g, expenses: g.expenses.filter(e => e.id !== expenseId) }
    }))
  }, [])

  const createSettleRequest = useCallback((groupId) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      if ((g.settleRequests || []).some(r => r.status === 'open')) return g
      const activeExpenses = g.expenses.filter(e => !e.settled)
      if (activeExpenses.length === 0) return g
      const transfers = simplifyDebts(activeExpenses, g.members, g.settlements || [])
      if (transfers.length === 0) return g
      const payments = {}
      transfers.forEach(t => { payments[t.from] = false })
      const request = {
        id: `sr${Date.now()}`,
        status: 'open',
        createdAt: new Date().toISOString(),
        createdBy: 'me',
        transfers,
        payments,
        expenseIds: activeExpenses.map(e => e.id),
      }
      return { ...g, settleRequests: [...(g.settleRequests || []), request] }
    }))
  }, [])

  const confirmPayment = useCallback((groupId, requestId, memberId) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      const updatedRequests = g.settleRequests.map(r => {
        if (r.id !== requestId) return r
        const payments = { ...r.payments, [memberId]: true }
        const allPaid = Object.values(payments).every(v => v === true)
        return {
          ...r, payments,
          status: allPaid ? 'closed' : r.status,
          ...(allPaid ? { closedAt: new Date().toISOString() } : {}),
        }
      })
      const closedRequest = updatedRequests.find(r => r.id === requestId && r.status === 'closed')
      const updatedExpenses = closedRequest
        ? g.expenses.map(e =>
            (closedRequest.expenseIds || []).includes(e.id) ? { ...e, settled: true } : e
          )
        : g.expenses
      return { ...g, settleRequests: updatedRequests, expenses: updatedExpenses }
    }))
  }, [])

  const [connectedMethods, setConnectedMethods] = useState({ kakaopay: false, toss: false, bank: false })

  const connectMethod = useCallback((methodId) => {
    setConnectedMethods(prev => ({ ...prev, [methodId]: true }))
  }, [])

  const disconnectMethod = useCallback((methodId) => {
    setConnectedMethods(prev => ({ ...prev, [methodId]: false }))
  }, [])

  const closeSettleRequest = useCallback((groupId, requestId) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        settleRequests: g.settleRequests.map(r =>
          r.id === requestId ? { ...r, status: 'closed' } : r
        ),
      }
    }))
  }, [])

  return (
    <AppContext.Provider value={{
      groups, users, getGroup,
      addExpense, markPaid,
      addGroup, removeGroup, removeExpense,
      createSettleRequest, confirmPayment, closeSettleRequest,
      connectedMethods, connectMethod, disconnectMethod,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
