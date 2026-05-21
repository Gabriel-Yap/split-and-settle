import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'

function BankIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
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

const METHODS = [
  {
    id: 'kakaopay',
    name: 'KakaoPay',
    description: 'Pay instantly with your KakaoPay wallet',
    bg: '#FEE500',
    color: '#000',
    initial: 'K',
  },
  {
    id: 'toss',
    name: 'Toss',
    description: 'Send money via Toss in seconds',
    bg: '#0064FF',
    color: '#fff',
    initial: 'T',
  },
  {
    id: 'bank',
    name: 'Bank Card',
    description: 'Pay by standard bank transfer',
    bg: '#F0EDE6',
    color: '#4A3F35',
    Icon: BankIcon,
    connectLabel: 'Add bank card',
  },
]

export default function PaymentMethods() {
  const navigate = useNavigate()
  const { connectedMethods, connectMethod, disconnectMethod } = useApp()

  return (
    <div className="screen" style={{ paddingTop: 0 }}>
      {/* Header */}
      <div style={{
        background: 'var(--ink)', margin: '0 -18px',
        padding: '52px 22px 24px', borderRadius: '0 0 24px 24px',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,251,245,0.6)', fontSize: 24, marginBottom: 12, padding: 0 }}
          aria-label="Back"
        >←</button>
        <h2 style={{ color: '#FAFAF7', fontSize: 20, marginBottom: 4 }}>Payment methods</h2>
        <p style={{ color: 'rgba(255,250,245,0.5)', fontSize: 13 }}>
          Connect a method to set it as default when settling up.
        </p>
      </div>

      <div style={{ marginTop: 24 }}>
        {METHODS.map((method, i) => {
          const connected = connectedMethods?.[method.id]
          const Icon = method.Icon

          return (
            <div
              key={method.id}
              className={`card fade-up-${Math.min(i + 1, 5)}`}
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}
            >
              {/* Logo area */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: method.bg, color: method.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
              }}>
                {Icon ? <Icon /> : method.initial}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                  color: 'var(--ink)', marginBottom: 3,
                }}>
                  {method.name}
                </p>
                {connected ? (
                  <span style={{
                    fontSize: 12, color: 'var(--green-dark)',
                    fontFamily: 'var(--font-body)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Connected
                  </span>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{method.description}</p>
                )}
              </div>

              {/* Action button */}
              {connected ? (
                <button
                  onClick={() => disconnectMethod(method.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => connectMethod(method.id)}
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  {method.connectLabel || 'Connect'}
                </button>
              )}
            </div>
          )
        })}

        <div style={{
          marginTop: 8, padding: '12px 16px',
          background: 'var(--blue-light)', borderRadius: 12,
          border: '1px solid rgba(58,122,232,0.15)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--blue)', lineHeight: 1.5 }}>
            <strong>Prototype note:</strong> Connecting a method marks it as your default in the payment sheet. No real account linking happens.
          </p>
        </div>
      </div>
    </div>
  )
}
