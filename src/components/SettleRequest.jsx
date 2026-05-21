import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { formatKRWFull } from '../utils/debt.js'
import Avatar from './Avatar.jsx'

function BankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M5 10V6l7-3 7 3v4" />
      <line x1="7" y1="10" x2="7" y2="21" />
      <line x1="11" y1="10" x2="11" y2="21" />
      <line x1="13" y1="10" x2="13" y2="21" />
      <line x1="17" y1="10" x2="17" y2="21" />
    </svg>
  )
}

const PAYMENT_OPTIONS = [
  { id: 'kakaopay', label: 'KakaoPay',      bg: '#FEE500', color: '#000000', weight: 700 },
  { id: 'toss',     label: 'Toss',          bg: '#0064FF', color: '#ffffff', weight: 700 },
  { id: 'bank',     label: 'Bank transfer', bg: '#F0EDE6', color: '#4A3F35', weight: 600, Icon: BankIcon },
]

function statusMessage(transfers, payments, cardState, users) {
  const unpaid = transfers.filter(t => !payments[t.from] && !cardState[t.from])
  const n = unpaid.length
  if (n === 0) return "Everyone's paid!"
  const hasMe = unpaid.some(t => t.from === 'me')
  const others = unpaid.filter(t => t.from !== 'me')
  if (n === 1 && hasMe) return 'Your payment is pending'
  if (n === 1) {
    const name = (users[unpaid[0].from]?.name || 'Someone').split(' ')[0]
    return `Almost there — waiting on ${name}`
  }
  if (n === 2 && hasMe) {
    const name = (users[others[0].from]?.name || 'someone').split(' ')[0]
    return `You and ${name} still need to pay`
  }
  return `Waiting on ${n} people`
}

export default function SettleRequest() {
  const { id, requestId } = useParams()
  const { getGroup, users, confirmPayment, connectedMethods } = useApp()
  const navigate = useNavigate()
  const group = getGroup(id)
  const request = group?.settleRequests?.find(r => r.id === requestId)

  const [allDone, setAllDone]       = useState(() => request?.status === 'closed')
  const [payModalFor, setPayModalFor] = useState(null)  // transfer object | null
  const [cardState, setCardState]   = useState({})      // { [memberId]: 'processing' | 'sent' }

  if (!group || !request) {
    return <div className="screen"><p>Request not found.</p></div>
  }

  const paidCount  = Object.values(request.payments).filter(v => v).length
  const total      = Object.keys(request.payments).length
  const progressPct = total === 0 ? 100 : Math.round((paidCount / total) * 100)

  // Payment options with connected default first
  const orderedOptions = [...PAYMENT_OPTIONS].sort((a, b) => {
    const ca = connectedMethods?.[a.id], cb = connectedMethods?.[b.id]
    return (ca && !cb) ? -1 : (!ca && cb) ? 1 : 0
  })

  function handlePayOption(optionId, transfer) {
    setPayModalFor(null)
    setCardState(prev => ({ ...prev, [transfer.from]: 'processing' }))
    setTimeout(() => {
      setCardState(prev => ({ ...prev, [transfer.from]: 'sent' }))
      const othersPaid = Object.entries(request.payments)
        .filter(([k]) => k !== transfer.from)
        .every(([, v]) => v)
      confirmPayment(id, requestId, transfer.from)
      if (othersPaid) setTimeout(() => setAllDone(true), 600)
    }, 1500)
  }

  function handleMarkReceived(memberId) {
    const othersPaid = Object.entries(request.payments)
      .filter(([k]) => k !== memberId)
      .every(([, v]) => v)
    confirmPayment(id, requestId, memberId)
    if (othersPaid) setTimeout(() => setAllDone(true), 300)
  }

  if (allDone) {
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
          {request.transfers.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < request.transfers.length - 1 ? '1px solid var(--cream-border)' : 'none' }}>
              <Avatar user={users[t.from]} size={30} />
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>→</span>
              <Avatar user={users[t.to]} size={30} />
              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {t.from === 'me' ? 'You' : users[t.from]?.name} → {t.to === 'me' ? 'you' : users[t.to]?.name}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green-dark)' }}>✓</span>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-full" onClick={() => navigate(`/group/${id}`)}>
          Back to group
        </button>
      </div>
    )
  }

  const headline = statusMessage(request.transfers, request.payments, cardState, users)

  return (
    <div className="screen" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', margin: '0 -18px', padding: '52px 22px 24px', borderRadius: '0 0 24px 24px' }}>
        <button
          onClick={() => navigate(`/group/${id}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,251,245,0.6)', fontSize: 24, marginBottom: 12, padding: 0 }}
        >←</button>
        <h2 style={{ color: '#FAFAF7', fontSize: 20, marginBottom: 4 }}>Settle request</h2>
        <p style={{ color: 'rgba(255,250,245,0.5)', fontSize: 13 }}>{group.name}</p>
      </div>

      <div style={{ marginTop: 20 }}>
        {/* Status + progress card */}
        <div className="card fade-up" style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 10 }}>
            {headline}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>
              {paidCount} of {total} confirmed
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: progressPct === 100 ? 'var(--green-dark)' : 'var(--ink)' }}>
              {progressPct}%
            </span>
          </div>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Transfer cards */}
        {request.transfers.map((t, i) => {
          const isPaying   = t.from === 'me'
          const isReceiving = t.to === 'me'
          const involvesMe = isPaying || isReceiving
          const isPaid  = request.payments[t.from]
          const state   = cardState[t.from]

          return (
            <div
              key={i}
              className={`card fade-up-${Math.min(i + 1, 5)}`}
              style={{ marginBottom: 12, opacity: isPaid || state === 'sent' ? 0.55 : 1, transition: 'opacity 0.4s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar user={users[t.from]} size={42} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                    {isPaying
                      ? <><span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>You pay </span>{users[t.to]?.name}</>
                      : isReceiving
                        ? <><span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>Collect from </span>{users[t.from]?.name}</>
                        : <>{users[t.from]?.name}<span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}> pays </span>{users[t.to]?.name}</>
                    }
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: isPaying ? 'var(--amber-dark)' : isReceiving ? 'var(--green-dark)' : 'var(--ink-soft)' }}>
                    {formatKRWFull(t.amount)}
                  </p>
                </div>
                <Avatar user={users[t.to]} size={42} />
              </div>

              {/* Card action area */}
              {isPaid || state === 'sent' ? (
                <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--green-dark)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                    {isPaying ? 'Payment sent ✓' : isReceiving ? 'Received ✓' : `${users[t.from]?.name} paid ✓`}
                  </p>
                </div>
              ) : state === 'processing' ? (
                <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--amber-dark)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                    Processing payment…
                  </p>
                </div>
              ) : involvesMe ? (
                isPaying ? (
                  <button className="btn btn-amber btn-full" onClick={() => setPayModalFor(t)}>
                    Pay {formatKRWFull(t.amount)}
                  </button>
                ) : (
                  <button className="btn btn-green btn-full" onClick={() => handleMarkReceived(t.from)}>
                    Mark received
                  </button>
                )
              ) : (
                <div style={{ background: 'var(--cream-dark)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>
                    Waiting for {users[t.from]?.name}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment method bottom sheet */}
      {payModalFor && (
        <div className="modal-overlay" onClick={() => setPayModalFor(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ marginBottom: 3 }}>Pay {users[payModalFor.to]?.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{formatKRWFull(payModalFor.amount)}</p>
              </div>
              <button
                onClick={() => setPayModalFor(null)}
                style={{
                  background: 'var(--cream-dark)', border: 'none', cursor: 'pointer',
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: 'var(--ink-muted)', flexShrink: 0,
                }}
              >×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orderedOptions.map(opt => {
                const isDefault = connectedMethods?.[opt.id]
                const Icon = opt.Icon
                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePayOption(opt.id, payModalFor)}
                    style={{
                      width: '100%', padding: '14px 18px',
                      background: opt.bg, color: opt.color,
                      border: `2px solid ${isDefault ? 'rgba(46,175,114,0.45)' : 'transparent'}`,
                      borderRadius: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontFamily: 'var(--font-display)', fontWeight: opt.weight, fontSize: 15,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {Icon && <Icon />}
                      <span>{opt.label}</span>
                    </div>
                    {isDefault && (
                      <span style={{
                        fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 600,
                        background: 'rgba(46,175,114,0.18)', color: '#1A7A4E',
                        padding: '2px 9px', borderRadius: 99,
                      }}>
                        Default
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-muted)', marginTop: 18 }}>
              Prototype only — no real payment is processed.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

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
