import { useState } from 'react'
import { useApp } from '../AppContext.jsx'
import { CATEGORY_META } from '../data/seed.js'
import { formatKRWFull } from '../utils/debt.js'
import Avatar from './Avatar.jsx'

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

function CheckIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export default function Activity() {
  const { groups, users } = useApp()
  const [detailItem, setDetailItem] = useState(null)

  // ── Build feed ──────────────────────────────────────────────────────────
  const expenseItems = groups.flatMap(g =>
    g.expenses.map(e => ({
      type: 'expense', sortKey: new Date(e.date).getTime(),
      group: g, expense: e,
    }))
  )

  const settlementItems = groups.flatMap(g =>
    (g.settleRequests || [])
      .filter(r => r.status === 'closed' && r.closedAt)
      .map(r => ({
        type: 'settlement', sortKey: new Date(r.closedAt).getTime(),
        group: g, request: r,
      }))
  )

  const feed = [...expenseItems, ...settlementItems].sort((a, b) => b.sortKey - a.sortKey)

  // ── Detail modal data ────────────────────────────────────────────────────
  const detail = detailItem
  const detailTotal = detail ? detail.request.transfers.reduce((s, t) => s + t.amount, 0) : 0

  return (
    <div className="screen">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22 }}>Activity</h2>
      </div>

      {feed.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <h3>No activity yet</h3>
          <p>Expenses you add to groups will appear here.</p>
        </div>
      )}

      {feed.map((item, i) => {
        const cls = `card fade-up-${Math.min(i + 1, 5)}`

        /* ── Settlement card ── */
        if (item.type === 'settlement') {
          const { group, request } = item
          const total = request.transfers.reduce((s, t) => s + t.amount, 0)
          const n = request.transfers.length

          return (
            <div
              key={`sr-${request.id}`}
              className={cls}
              style={{
                marginBottom: 10, cursor: 'pointer',
                borderColor: 'rgba(46,175,114,0.28)',
                borderLeftWidth: 3, borderLeftColor: 'var(--green)',
              }}
              onClick={() => setDetailItem(item)}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'var(--green-light)', color: 'var(--green-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckIcon />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                      Group settled up
                    </p>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--green-dark)', flexShrink: 0 }}>
                      {formatKRWFull(total)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-muted)', background: 'var(--cream-dark)', padding: '2px 8px', borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {group.emoji} {group.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--green-dark)', background: 'var(--green-light)', padding: '2px 8px', borderRadius: 99, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                      ✓ Settled
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      {n} {n === 1 ? 'transfer' : 'transfers'} confirmed · {fmtDate(request.closedAt)}
                    </p>
                    <span style={{ color: 'var(--ink-muted)', display: 'flex' }}>
                      <ChevronRight />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        /* ── Expense card ── */
        const { group, expense: exp } = item
        const cat      = CATEGORY_META[exp.category] || CATEGORY_META.other
        const payer    = users[exp.paidBy]
        const myShare  = exp.split?.me || 0
        const iAmPayer = exp.paidBy === 'me'

        return (
          <div
            key={exp.id}
            className={cls}
            style={{ marginBottom: 10, opacity: exp.settled ? 0.65 : 1 }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: 'var(--cream-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {cat.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                    {exp.description}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', flexShrink: 0 }}>
                    {formatKRWFull(exp.amount)}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)', background: 'var(--cream-dark)', padding: '2px 8px', borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    {group.emoji} {group.name}
                  </span>
                  {exp.settled && (
                    <span style={{ fontSize: 11, color: 'var(--green-dark)', background: 'var(--green-light)', padding: '2px 8px', borderRadius: 99, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                      ✓ Settled
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  {iAmPayer ? 'You paid' : `${payer?.name} paid`}
                  {myShare > 0 && !iAmPayer && ` · your share ${formatKRWFull(myShare)}`}
                  {' · '}{fmtDate(exp.date)}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {/* ── Settlement detail bottom sheet ── */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>

            {/* Sheet header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: 'var(--green-light)', color: 'var(--green-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckIcon />
                </div>
                <div>
                  <h3 style={{ marginBottom: 2 }}>Group settled up</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    {detail.group.emoji} {detail.group.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                style={{
                  background: 'var(--cream-dark)', border: 'none', cursor: 'pointer',
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: 'var(--ink-muted)', flexShrink: 0,
                }}
              >×</button>
            </div>

            {/* Total banner */}
            <div style={{
              background: 'var(--green-light)', borderRadius: 12,
              padding: '12px 16px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ fontSize: 13, color: 'var(--green-dark)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                Total transferred
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--green-dark)' }}>
                {formatKRWFull(detailTotal)}
              </p>
            </div>

            {/* Section label */}
            <p style={{
              fontSize: 11, color: 'var(--ink-muted)',
              fontFamily: 'var(--font-body)', fontWeight: 600,
              letterSpacing: '0.5px', textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              Transfers
            </p>

            {/* Transfer rows */}
            {detail.request.transfers.map((t, i) => {
              const fromUser = users[t.from]
              const toUser   = users[t.to]
              const fromName = t.from === 'me' ? 'You' : fromUser?.name
              const toName   = t.to   === 'me' ? 'you' : toUser?.name
              const amtColor = t.from === 'me' ? 'var(--amber-dark)'
                             : t.to   === 'me' ? 'var(--green-dark)'
                             : 'var(--ink-soft)'
              const isLast = i === detail.request.transfers.length - 1

              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 0',
                  borderBottom: isLast ? 'none' : '1px solid var(--cream-border)',
                }}>
                  {/* From */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 44 }}>
                    <Avatar user={fromUser} size={38} />
                    <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                      {t.from === 'me' ? 'You' : fromUser?.name?.split(' ')[0]}
                    </span>
                  </div>

                  {/* Arrow */}
                  <span style={{ color: 'var(--ink-muted)', display: 'flex', flexShrink: 0 }}>
                    <ArrowRight />
                  </span>

                  {/* To */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 44 }}>
                    <Avatar user={toUser} size={38} />
                    <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                      {t.to === 'me' ? 'You' : toUser?.name?.split(' ')[0]}
                    </span>
                  </div>

                  {/* Amount + label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: amtColor, marginBottom: 2 }}>
                      {formatKRWFull(t.amount)}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      {fromName} paid {toName}
                    </p>
                  </div>

                  {/* Confirmed badge */}
                  <span style={{
                    fontSize: 11, color: 'var(--green-dark)',
                    background: 'var(--green-light)', padding: '3px 9px',
                    borderRadius: 99, fontFamily: 'var(--font-body)', fontWeight: 600, flexShrink: 0,
                  }}>
                    Paid ✓
                  </span>
                </div>
              )
            })}

            {/* Footer timestamp */}
            <p style={{
              textAlign: 'center', fontSize: 12, color: 'var(--ink-muted)',
              marginTop: 14, paddingTop: 14,
              borderTop: '1px solid var(--cream-border)',
            }}>
              All confirmed {fmtDateTime(detail.request.closedAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
