import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { simplifyDebts, myBalance, formatKRW, formatKRWFull } from '../utils/debt.js'
import Avatar from './Avatar.jsx'

// priority: 0 = needs my action, 1 = waiting on others (open request), 2 = unsettled no request, 3 = all settled
function getGroupStatus(group) {
  const openRequest = (group.settleRequests || []).find(r => r.status === 'open')

  if (openRequest) {
    const iNeedToPay = openRequest.transfers.some(
      t => t.from === 'me' && !openRequest.payments['me']
    )
    const unpaidToMe = openRequest.transfers.filter(
      t => t.to === 'me' && !openRequest.payments[t.from]
    )

    if (iNeedToPay) {
      return { priority: 0, indicator: 'amber', text: 'Settle request waiting on you' }
    }
    if (unpaidToMe.length > 0) {
      const n = unpaidToMe.length
      return { priority: 0, indicator: 'amber', text: `Waiting on ${n} ${n === 1 ? 'person' : 'people'}` }
    }
    return { priority: 1, indicator: 'blue', text: 'Waiting on others to confirm' }
  }

  if (group.expenses.length > 0 && group.expenses.every(e => e.settled)) {
    return { priority: 3, indicator: 'green', text: 'All sorted' }
  }

  return { priority: 2, indicator: null, text: null }
}

export default function Home() {
  const { groups, users, removeGroup } = useApp()
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(null)

  // compute my overall balance across all groups (unsettled expenses only)
  let totalOwed = 0, totalOwedTo = 0
  groups.forEach(g => {
    const unsettled = g.expenses.filter(e => !e.settled)
    const transfers = simplifyDebts(unsettled, g.members, g.settlements || [])
    const { owed, owedTo } = myBalance(transfers, 'me')
    totalOwed   += owed
    totalOwedTo += owedTo
  })
  const net = totalOwedTo - totalOwed

  // Sort: needs action → waiting on others → unsettled → fully done
  const sortedGroups = [...groups].sort((a, b) =>
    getGroupStatus(a).priority - getGroupStatus(b).priority
  )

  return (
    <div className="screen" style={{ paddingTop: 0 }}>
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(155deg, #1A1410 0%, #3A2A1E 100%)',
        margin: '0 -18px', padding: '52px 22px 26px',
        borderRadius: '0 0 24px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{
            color: 'rgba(255,250,245,0.45)', fontSize: 10,
            fontFamily: 'var(--font-body)', fontWeight: 600,
            letterSpacing: '1.4px', textTransform: 'uppercase',
          }}>
            Split &amp; Settle
          </p>
          <button
            onClick={() => navigate('/payment-methods')}
            style={{
              background: 'rgba(255,250,245,0.08)', border: '1px solid rgba(255,250,245,0.12)',
              borderRadius: 10, cursor: 'pointer', padding: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,250,245,0.65)',
            }}
            aria-label="Payment methods"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
        <h1 style={{ color: '#FAFAF7', fontSize: 24, marginBottom: 18 }}>Your groups</h1>

        {/* Net balance card */}
        <div style={{
          background: 'rgba(255,250,245,0.07)',
          borderRadius: 14,
          border: '1px solid rgba(255,250,245,0.10)',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{
              color: 'rgba(255,250,245,0.45)', fontSize: 10,
              fontFamily: 'var(--font-body)', fontWeight: 600,
              letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 5,
            }}>
              Overall balance
            </p>
            <p style={{
              color: net >= 0 ? '#4ADE80' : '#FCA5A5',
              fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800,
              letterSpacing: '-0.5px',
            }}>
              {net >= 0 ? '+' : ''}{formatKRWFull(net)}
            </p>
            <p style={{ color: 'rgba(255,250,245,0.38)', fontSize: 12, marginTop: 3 }}>
              {net >= 0
                ? `Others owe you ${formatKRW(totalOwedTo)}`
                : `You owe ${formatKRW(totalOwed)}`}
            </p>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,250,245,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {net >= 0 ? '😊' : '😅'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {/* ── Group cards ── */}
        {sortedGroups.length === 0 && (
          <div className="empty" style={{ paddingTop: 60 }}>
            <div className="empty-icon">👥</div>
            <h3>No groups yet</h3>
            <p>Create a group to start splitting expenses.</p>
          </div>
        )}

        {sortedGroups.map((group, i) => {
          const unsettled = group.expenses.filter(e => !e.settled)
          const transfers = simplifyDebts(unsettled, group.members, group.settlements || [])
          const { owed, owedTo } = myBalance(transfers, 'me')
          const status = getGroupStatus(group)

          return (
            <div
              key={group.id}
              className={`card fade-up-${Math.min(i + 1, 5)}`}
              style={{ marginBottom: 10, cursor: 'pointer', position: 'relative' }}
              onClick={() => navigate(`/group/${group.id}`)}
            >
              {/* Pulsing amber dot */}
              {status.indicator === 'amber' && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--amber)',
                  border: '2px solid var(--cream)',
                  animation: 'pulseAmber 1.5s ease-in-out infinite',
                  zIndex: 1,
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Group emoji */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--cream-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {group.emoji}
                </div>

                {/* Name + members + status */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 15, marginBottom: 3 }}>{group.name}</h3>
                  {status.text && (
                    <p style={{
                      fontSize: 11, fontWeight: 600, marginBottom: 4,
                      color: status.indicator === 'amber' ? 'var(--amber-dark)'
                           : status.indicator === 'blue'  ? 'var(--blue)'
                           : 'var(--green-dark)',
                    }}>
                      {status.indicator === 'green' && '✓ '}{status.text}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {group.members.slice(0, 4).map(mid => (
                      <Avatar key={mid} user={users[mid]} size={20} />
                    ))}
                    <span style={{
                      fontSize: 11, color: 'var(--ink-muted)',
                      fontFamily: 'var(--font-body)', fontWeight: 500, marginLeft: 2,
                    }}>
                      {group.members.length} members
                    </span>
                  </div>
                </div>

                {/* Balance + delete */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmingDelete(group) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-muted)', fontSize: 15, padding: '2px 4px', lineHeight: 1,
                    }}
                    aria-label="Delete group"
                  >🗑</button>
                  {owed > 0 && (
                    <span style={{
                      fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#C47D0E',
                    }}>
                      −{formatKRW(owed)}
                    </span>
                  )}
                  {owedTo > 0 && (
                    <span style={{
                      fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green-dark)',
                    }}>
                      +{formatKRW(owedTo)}
                    </span>
                  )}
                  {owed === 0 && owedTo === 0 && (
                    <span style={{
                      fontSize: 12, color: 'var(--ink-muted)',
                      fontFamily: 'var(--font-body)', fontWeight: 500,
                    }}>
                      All square
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* New group button */}
        <button
          className="btn btn-ghost btn-full fade-up-5"
          style={{ marginTop: 8 }}
          onClick={() => navigate('/new-group')}
        >
          <span style={{ fontSize: 16 }}>＋</span> New group
        </button>
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmingDelete && (
        <div className="modal-overlay" onClick={() => setConfirmingDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Delete group?</h3>
            <p style={{ marginBottom: 22, lineHeight: 1.55 }}>
              Remove <strong>{confirmingDelete.name}</strong> and all its expenses? This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setConfirmingDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn-full"
                style={{ background: '#E8523A', color: '#fff', border: 'none' }}
                onClick={() => { removeGroup(confirmingDelete.id); setConfirmingDelete(null) }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
