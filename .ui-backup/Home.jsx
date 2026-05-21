import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { simplifyDebts, myBalance, formatKRW, formatKRWFull } from '../utils/debt.js'
import Avatar from './Avatar.jsx'

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

  return (
    <div className="screen" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1A1410 0%, #3D2F22 100%)',
        margin: '-0px -18px 0', padding: '52px 22px 28px',
        borderRadius: '0 0 28px 28px',
      }}>
        <p style={{ color: 'rgba(255,251,245,0.6)', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
          안녕하세요 👋
        </p>
        <h1 style={{ color: '#FFFBF5', fontSize: 26, marginBottom: 20 }}>Your groups</h1>

        {/* Net balance card */}
        <div style={{
          background: 'rgba(255,251,245,0.08)', borderRadius: 18,
          border: '1px solid rgba(255,251,245,0.12)', padding: '16px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <p style={{ color: 'rgba(255,251,245,0.55)', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
              Overall balance
            </p>
            <p style={{
              color: net >= 0 ? '#4ADE80' : '#FCA5A5',
              fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800
            }}>
              {net >= 0 ? '+' : ''}{formatKRWFull(net)}
            </p>
            <p style={{ color: 'rgba(255,251,245,0.45)', fontSize: 12, marginTop: 3 }}>
              {net >= 0 ? `Others owe you ${formatKRW(totalOwedTo)}` : `You owe ${formatKRW(totalOwed)}`}
            </p>
          </div>
          <div style={{ fontSize: 40 }}>
            {net >= 0 ? '😊' : '😅'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {/* Group cards */}
        {groups.map((group, i) => {
          const unsettled = group.expenses.filter(e => !e.settled)
          const transfers = simplifyDebts(unsettled, group.members, group.settlements || [])
          const { owed, owedTo } = myBalance(transfers, 'me')

          return (
            <div
              key={group.id}
              className={`card fade-up-${Math.min(i + 1, 5)}`}
              style={{ marginBottom: 12, cursor: 'pointer' }}
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: 'var(--cream-dark)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
                }}>
                  {group.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ marginBottom: 2, fontSize: 16 }}>{group.name}</h3>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {group.members.slice(0, 4).map(mid => (
                      <Avatar key={mid} user={users[mid]} size={22} />
                    ))}
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {group.members.length} people
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmingDelete(group) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 16, padding: '2px 4px', lineHeight: 1 }}
                    aria-label="Delete group"
                  >🗑</button>
                  {owed > 0 && (
                    <p style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#C47D0E' }}>
                      -{formatKRW(owed)}
                    </p>
                  )}
                  {owedTo > 0 && (
                    <p style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green-dark)' }}>
                      +{formatKRW(owedTo)}
                    </p>
                  )}
                  {owed === 0 && owedTo === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      All square
                    </p>
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
          <span style={{ fontSize: 18 }}>＋</span> New group
        </button>
      </div>

      {/* Delete group confirm modal */}
      {confirmingDelete && (
        <div className="modal-overlay" onClick={() => setConfirmingDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Delete group?</h3>
            <p style={{ marginBottom: 20, lineHeight: 1.5 }}>
              Remove <strong>{confirmingDelete.name}</strong> and all its expenses? This can't be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setConfirmingDelete(null)}>Cancel</button>
              <button className="btn btn-full" style={{ background: '#EF4444', color: '#fff', border: 'none' }}
                onClick={() => { removeGroup(confirmingDelete.id); setConfirmingDelete(null) }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
