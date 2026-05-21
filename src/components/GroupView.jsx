import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { simplifyDebts, myBalance, settlementProgress, formatKRWFull } from '../utils/debt.js'
import { CATEGORY_META } from '../data/seed.js'
import Avatar from './Avatar.jsx'

export default function GroupView() {
  const { id } = useParams()
  const { getGroup, users, removeExpense, createSettleRequest } = useApp()
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(null)
  const group = getGroup(id)

  if (!group) return <div className="screen"><p>Group not found.</p></div>

  const unsettledExpenses = group.expenses.filter(e => !e.settled)
  const transfers = simplifyDebts(unsettledExpenses, group.members, group.settlements || [])
  const myTransfers = transfers.filter(t => t.from === 'me' || t.to === 'me')
  const { owed, owedTo } = myBalance(myTransfers, 'me')
  const progress = settlementProgress(unsettledExpenses, group.members, group.settlements || [])
  const openRequest = (group.settleRequests || []).find(r => r.status === 'open')

  return (
    <div className="screen" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div style={{
        background: 'var(--ink)', margin: '0 -18px',
        padding: '52px 22px 24px', borderRadius: '0 0 28px 28px',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,251,245,0.6)', fontSize: 24, marginBottom: 12, padding: 0 }}
          aria-label="Back"
        >←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 36 }}>{group.emoji}</div>
          <div>
            <h2 style={{ color: '#FFFBF5', fontSize: 20, marginBottom: 4 }}>{group.name}</h2>
            <div style={{ display: 'flex', gap: 4 }}>
              {group.members.map(mid => <Avatar key={mid} user={users[mid]} size={24} />)}
            </div>
          </div>
        </div>

        {/* My balance chip */}
        {(owed > 0 || owedTo > 0) && (
          <div style={{
            background: 'rgba(255,251,245,0.08)', borderRadius: 12,
            border: '1px solid rgba(255,251,245,0.12)', padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              {owed > 0 && <p style={{ color: '#FCA5A5', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>You owe {formatKRWFull(owed)}</p>}
              {owedTo > 0 && <p style={{ color: '#4ADE80', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>You're owed {formatKRWFull(owedTo)}</p>}
            </div>
            {openRequest ? (
              <button
                className="btn btn-amber btn-sm"
                onClick={() => navigate(`/group/${id}/settle-request/${openRequest.id}`)}
              >
                View request
              </button>
            ) : myTransfers.length > 0 && (
              <button
                className="btn btn-amber btn-sm"
                onClick={() => createSettleRequest(id)}
              >
                Start request
              </button>
            )}
          </div>
        )}
        {owed === 0 && owedTo === 0 && (
          <div style={{ background: 'rgba(46,175,114,0.15)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(46,175,114,0.25)' }}>
            <p style={{ color: '#4ADE80', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
              ✓ You're all square in this group!
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: 22 }}>
        {/* Expense list */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15 }}>Expenses</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/group/${id}/add`)}
          >
            + Add
          </button>
        </div>

        {group.expenses.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🧾</div>
            <h3>No expenses yet</h3>
            <p>Add your first expense to get started.</p>
          </div>
        )}

        {[...group.expenses].reverse().map((exp, i) => {
          const payer = users[exp.paidBy]
          const cat = CATEGORY_META[exp.category] || CATEGORY_META.other
          const myShare = exp.split['me'] || 0
          const iAmPayer = exp.paidBy === 'me'
          const isSettled = !!exp.settled

          return (
            <div key={exp.id} className={`card fade-up-${Math.min(i+1,5)}`} style={{ marginBottom: 10, opacity: isSettled ? 0.5 : 1 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'var(--cream-dark)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                }}>
                  {cat.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                      {exp.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
                        {formatKRWFull(exp.amount)}
                      </p>
                      {!isSettled && (
                        <button
                          onClick={() => setConfirmingDelete(exp)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 14, padding: '2px 0', lineHeight: 1 }}
                          aria-label="Delete expense"
                        >🗑</button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      {iAmPayer ? '✓ You paid' : `${payer.name} paid`}
                    </span>
                    {isSettled && (
                      <span style={{
                        fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700,
                        color: 'var(--green-dark)', background: 'var(--green-light)',
                        borderRadius: 6, padding: '2px 7px'
                      }}>Settled</span>
                    )}
                  </div>
                  {!isSettled && myShare > 0 && !iAmPayer && (
                    <p style={{ fontSize: 12, color: 'var(--amber-dark)', fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 4 }}>
                      Your share: {formatKRWFull(myShare)}
                    </p>
                  )}
                  {!isSettled && iAmPayer && progress < 100 && (
                    <p style={{ fontSize: 12, color: 'var(--green-dark)', fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: 4 }}>
                      Waiting on others
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Settle request CTA */}
        {transfers.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {openRequest ? (
              <>
                <button
                  className="btn btn-amber btn-full fade-up-5"
                  onClick={() => navigate(`/group/${id}/settle-request/${openRequest.id}`)}
                >
                  View settle request
                </button>
                <button
                  className="btn btn-ghost btn-full"
                  disabled
                  title="A settle request is already in progress"
                  style={{ opacity: 0.45, cursor: 'not-allowed' }}
                >
                  New settle request
                </button>
              </>
            ) : (
              <button
                className="btn btn-amber btn-full fade-up-5"
                onClick={() => createSettleRequest(id)}
              >
                Start settle request
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete expense confirm modal */}
      {confirmingDelete && (
        <div className="modal-overlay" onClick={() => setConfirmingDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Delete expense?</h3>
            <p style={{ marginBottom: 20, lineHeight: 1.5 }}>
              Remove <strong>{confirmingDelete.description}</strong> ({formatKRWFull(confirmingDelete.amount)})? This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setConfirmingDelete(null)}>Cancel</button>
              <button className="btn btn-full" style={{ background: '#EF4444', color: '#fff', border: 'none' }}
                onClick={() => { removeExpense(id, confirmingDelete.id); setConfirmingDelete(null) }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
