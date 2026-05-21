import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { simplifyDebts, settlementProgress, formatKRWFull } from '../utils/debt.js'
import Avatar from './Avatar.jsx'

export default function SettleUp() {
  const { id } = useParams()
  const { getGroup, users, markPaid } = useApp()
  const navigate = useNavigate()
  const group = getGroup(id)

  const [paid, setPaid] = useState({}) // { `${from}-${to}`: true }
  const [confirming, setConfirming] = useState(null)
  const [allDone, setAllDone] = useState(false)
  const initialTransfersRef = useRef(null)

  if (!group) return null

  const transfers = simplifyDebts(group.expenses, group.members, group.settlements || [])
  const myTransfers = transfers.filter(t => t.from === 'me' || t.to === 'me')
  const progress = settlementProgress(group.expenses, group.members, group.settlements || [])

  // Capture only my transfers once, before payments shrink the list
  if (initialTransfersRef.current === null && myTransfers.length > 0) {
    initialTransfersRef.current = myTransfers
  }

  function handlePay(t) {
    setConfirming(t)
  }

  function confirmPay(t) {
    markPaid(id, t.from, t.to, t.amount)
    const key = `${t.from}-${t.to}`
    const newPaid = { ...paid, [key]: true }
    setPaid(newPaid)
    setConfirming(null)

    // compare against the original count, not the live (shrinking) transfers list
    if (Object.keys(newPaid).length >= (initialTransfersRef.current?.length ?? myTransfers.length)) {
      setTimeout(() => setAllDone(true), 300)
    }
  }

  // All done / celebration screen
  if (allDone) {
    const settledList = initialTransfersRef.current || []
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 80 }}>
        <Confetti />
        <div style={{ fontSize: 72, marginBottom: 20, animation: 'pop 0.5s cubic-bezier(0.34,1.2,0.64,1) both' }}>🎉</div>
        <h2 style={{ marginBottom: 10 }}>All square!</h2>
        <p style={{ maxWidth: 260, marginBottom: 28 }}>
          {group.name} is fully settled. No more chasing — everyone came through.
        </p>
        <div className="card" style={{ width: '100%', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--ink-muted)', marginBottom: 10 }}>SETTLED</p>
          {settledList.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < settledList.length - 1 ? '1px solid var(--cream-border)' : 'none' }}>
              <Avatar user={users[t.from]} size={30} />
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>→</span>
              <Avatar user={users[t.to]} size={30} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {t.from === 'me' ? 'You' : users[t.from].name} → {t.to === 'me' ? 'you' : users[t.to].name}
              </span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green-dark)' }}>✓</span>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-full" onClick={() => navigate(`/group/${id}`)}>
          Back to group
        </button>
      </div>
    )
  }

  return (
    <div className="screen" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', margin: '0 -18px', padding: '52px 22px 24px', borderRadius: '0 0 28px 28px' }}>
        <button onClick={() => navigate(`/group/${id}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,251,245,0.6)', fontSize: 24, marginBottom: 12, padding: 0 }}>←</button>
        <h2 style={{ color: '#FFFBF5', fontSize: 20, marginBottom: 4 }}>Settle up</h2>
        <p style={{ color: 'rgba(255,251,245,0.5)', fontSize: 13 }}>{group.name}</p>
      </div>

      <div style={{ marginTop: 20 }}>
        {/* Explanation */}
        <div style={{ background: 'var(--blue-light)', borderRadius: 14, padding: '12px 14px', marginBottom: 16, border: '1px solid rgba(58,122,232,0.15)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--blue)', marginBottom: 3 }}>Your payments to sort out</p>
          <p style={{ fontSize: 13, color: 'var(--blue)', lineHeight: 1.5 }}>
            Here's what you personally need to pay or collect. Tap each one to confirm.
          </p>
        </div>

        {myTransfers.length === 0 && (
          <div className="empty">
            <div className="empty-icon">✅</div>
            <h3>All settled!</h3>
            <p>No outstanding balances in this group.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/group/${id}`)}>Back to group</button>
          </div>
        )}

        {myTransfers.map((t, i) => {
          const key = `${t.from}-${t.to}`
          const isPaid = paid[key]
          const isPaying = t.from === 'me'
          const otherUser = isPaying ? users[t.to] : users[t.from]

          return (
            <div key={i} className={`card fade-up-${Math.min(i+1,5)}`} style={{ marginBottom: 12, opacity: isPaid ? 0.5 : 1, transition: 'opacity 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar user={otherUser} size={42} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                    {isPaying
                      ? <><span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>You pay </span>{otherUser.name}</>
                      : <><span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>Collect from </span>{otherUser.name}</>
                    }
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: isPaying ? 'var(--amber-dark)' : 'var(--green-dark)' }}>
                    {formatKRWFull(t.amount)}
                  </p>
                </div>
              </div>

              {isPaid ? (
                <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--green-dark)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                    ✓ {isPaying ? 'You paid' : 'Received'}!
                  </p>
                </div>
              ) : (
                <button
                  className={`btn ${isPaying ? 'btn-amber' : 'btn-green'} btn-full`}
                  onClick={() => handlePay(t)}>
                  {isPaying ? 'Pay' : 'Mark received'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div className="modal-overlay" onClick={() => setConfirming(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>
              {confirming.from === 'me' ? 'Confirm payment' : 'Confirm receipt'}
            </h3>
            <p style={{ marginBottom: 20, lineHeight: 1.5 }}>
              {confirming.from === 'me'
                ? `You've paid ${formatKRWFull(confirming.amount)} to ${users[confirming.to].name}?`
                : `You've received ${formatKRWFull(confirming.amount)} from ${users[confirming.from].name}?`
              }
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setConfirming(null)}>Not yet</button>
              <button className="btn btn-green btn-full" onClick={() => confirmPay(confirming)}>Yes, confirmed!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple CSS confetti
function Confetti() {
  const colors = ['#F5A623', '#2EAF72', '#3A7AE8', '#E8523A', '#7C4DFF']
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id: i, color: colors[i % colors.length],
    left: `${(i / 18) * 100}%`,
    delay: `${(i * 0.08).toFixed(2)}s`,
    size: 6 + (i % 4) * 3,
  }))
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', pointerEvents: 'none', zIndex: 10 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, top: 0,
          width: p.size, height: p.size,
          background: p.color, borderRadius: 2,
          animation: `confettiFall 1.8s ${p.delay} ease-in both`,
        }} />
      ))}
    </div>
  )
}
