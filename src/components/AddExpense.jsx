import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { CATEGORY_META } from '../data/seed.js'
import Avatar from './Avatar.jsx'

const MOCK_IMPORTS = [
  { description: 'KakaoPay — Naver Smart Store', amount: 189000, category: 'gift',  source: 'kakaopay' },
  { description: 'KakaoPay — GS25 편의점',        amount: 18700,  category: 'food',  source: 'kakaopay' },
  { description: 'Toss — Starbucks Gangnam',      amount: 23500,  category: 'food',  source: 'toss'     },
  { description: 'Toss — CGV 영화관',              amount: 14000,  category: 'fun',   source: 'toss'     },
]

const IMPORT_SOURCES = [
  { id: 'kakaopay', label: 'KakaoPay', bg: '#FEE500', color: '#000000', subtitleColor: 'rgba(0,0,0,0.50)' },
  { id: 'toss',     label: 'Toss',     bg: '#0064FF', color: '#FFFFFF', subtitleColor: 'rgba(255,255,255,0.60)' },
]

function ImportFileIcon({ color }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <polyline points="9 14 12 17 15 14" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function AddExpense() {
  const { id } = useParams()
  const { getGroup, users, addExpense } = useApp()
  const navigate = useNavigate()
  const group = getGroup(id)

  // Form fields
  const [description, setDescription] = useState('')
  const [amount, setAmount]           = useState('')
  const [paidBy, setPaidBy]           = useState('me')
  const [category, setCategory]       = useState('food')
  const [splitType, setSplitType]     = useState('equal')
  const [customSplits, setCustomSplits] = useState({})
  const [step, setStep]               = useState(1)

  // UI state
  const [importSheet, setImportSheet] = useState(null)   // null | 'kakaopay' | 'toss'
  const [importing, setImporting]     = useState(false)  // fake import loading
  const [formExpanded, setFormExpanded] = useState(false)

  if (!group) return null

  const amountNum       = parseInt(amount.replace(/,/g, ''), 10) || 0
  const equalShare      = group.members.length > 0 ? Math.floor(amountNum / group.members.length) : 0
  const customTotal     = group.members.reduce((s, m) => s + (customSplits[m] || 0), 0)
  const customRemaining = amountNum - customTotal
  const sourceMeta      = importSheet ? IMPORT_SOURCES.find(s => s.id === importSheet) : null
  const sheetItems      = importSheet ? MOCK_IMPORTS.filter(m => m.source === importSheet) : []

  function handleImportPick(mock) {
    setImporting(true)
    setTimeout(() => {
      setDescription(mock.description)
      setAmount(mock.amount.toString())
      setCategory(mock.category)
      setImporting(false)
      setImportSheet(null)
      setFormExpanded(true)
      setStep(1)
    }, 900)
  }

  function handleAmountInput(val) {
    setAmount(val.replace(/[^0-9]/g, ''))
  }

  function getSplit() {
    if (splitType === 'equal') {
      const n = group.members.length
      const base = Math.floor(amountNum / n)
      const rem  = amountNum - base * n
      const split = {}
      group.members.forEach((m, i) => { split[m] = i < rem ? base + 1 : base })
      return split
    }
    return customSplits
  }

  function handleSubmit() {
    if (!description || amountNum === 0) return
    addExpense(id, {
      id: `e${Date.now()}`,
      description, amount: amountNum, paidBy, category,
      date: new Date().toISOString().split('T')[0],
      split: getSplit(),
    })
    navigate(`/group/${id}`)
  }

  return (
    <div className="screen" style={{ paddingTop: 0 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'var(--ink)', margin: '0 -18px',
        padding: '52px 22px 24px', borderRadius: '0 0 24px 24px',
      }}>
        <button
          onClick={() => navigate(`/group/${id}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,251,245,0.6)', fontSize: 24, marginBottom: 12, padding: 0 }}
        >←</button>
        <h2 style={{ color: '#FAFAF7', fontSize: 20, marginBottom: 4 }}>Add expense</h2>
        <p style={{ color: 'rgba(255,250,245,0.5)', fontSize: 13 }}>
          Import from your payment app or enter manually.
        </p>
      </div>

      <div style={{ marginTop: 20 }}>

        {/* ── Import cards ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
          {IMPORT_SOURCES.map(src => (
            <button
              key={src.id}
              onClick={() => setImportSheet(src.id)}
              style={{
                flex: 1, padding: '22px 14px 18px', borderRadius: 20,
                background: src.bg, color: src.color,
                border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                transition: 'transform 0.12s ease, box-shadow 0.12s ease',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={e  => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <ImportFileIcon color={src.color} />
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 17, color: src.color, marginBottom: 3,
                }}>
                  {src.label}
                </p>
                <p style={{ fontSize: 12, color: src.subtitleColor }}>Import receipt</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Divider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--cream-border)' }} />
          <span style={{
            fontSize: 12, color: 'var(--ink-muted)',
            fontFamily: 'var(--font-body)', fontWeight: 500,
          }}>
            or enter manually
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--cream-border)' }} />
        </div>

        {/* ── Toggle row (only visible on step 1) ── */}
        {step === 1 && (
          <button
            onClick={() => setFormExpanded(v => !v)}
            style={{
              width: '100%', padding: '13px 16px',
              background: 'var(--card-bg)',
              borderRadius: 14, border: '1px solid rgba(0,0,0,0.055)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', marginBottom: formExpanded ? 2 : 0,
            }}
          >
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)',
            }}>
              + Add manually
            </span>
            <span style={{
              color: 'var(--ink-muted)',
              display: 'inline-flex',
              transition: 'transform 0.28s ease',
              transform: formExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              <ChevronDown />
            </span>
          </button>
        )}

        {/* ── Expandable form ── */}
        <div style={{
          overflow: 'hidden',
          maxHeight: formExpanded ? '1400px' : '0',
          opacity: formExpanded ? 1 : 0,
          transition: 'max-height 0.38s ease, opacity 0.22s ease',
        }}>
          <div style={{ paddingTop: 12 }}>

            {/* Step 1: details */}
            {step === 1 && (
              <>
                {/* Amount */}
                <div className="card" style={{ textAlign: 'center', marginBottom: 14 }}>
                  <p style={{
                    fontSize: 11, color: 'var(--ink-muted)',
                    fontFamily: 'var(--font-body)', fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8,
                  }}>Amount</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--ink-muted)' }}>₩</span>
                    <input
                      className="amount-input"
                      style={{ fontSize: 36, width: 'auto', maxWidth: 200 }}
                      placeholder="0"
                      value={amount ? parseInt(amount).toLocaleString() : ''}
                      onChange={e => handleAmountInput(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="input-wrap" style={{ marginBottom: 14 }}>
                  <label className="input-label">What was it for?</label>
                  <input
                    className="input"
                    placeholder="e.g. Black pork BBQ"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div className="input-wrap" style={{ marginBottom: 14 }}>
                  <label className="input-label">Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(CATEGORY_META).map(([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => setCategory(key)}
                        style={{
                          padding: '7px 13px', borderRadius: 99, border: '1.5px solid',
                          borderColor: category === key ? 'var(--amber)' : 'var(--cream-border)',
                          background: category === key ? 'var(--amber-light)' : 'transparent',
                          cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                          color: category === key ? 'var(--amber-dark)' : 'var(--ink-muted)',
                        }}
                      >
                        {meta.emoji} {meta.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Who paid */}
                <div className="input-wrap" style={{ marginBottom: 20 }}>
                  <label className="input-label">Who paid?</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {group.members.map(mid => {
                      const u = users[mid]
                      return (
                        <button
                          key={mid}
                          onClick={() => setPaidBy(mid)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                            padding: '10px 14px', borderRadius: 12, border: '1.5px solid',
                            borderColor: paidBy === mid ? 'var(--amber)' : 'var(--cream-border)',
                            background: paidBy === mid ? 'var(--amber-light)' : 'transparent',
                            cursor: 'pointer', flex: 1,
                          }}
                        >
                          <Avatar user={u} size={32} />
                          <span style={{
                            fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700,
                            color: paidBy === mid ? 'var(--amber-dark)' : 'var(--ink-muted)',
                          }}>
                            {mid === 'me' ? 'You' : u.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-full"
                  onClick={() => setStep(2)}
                  disabled={!description || amountNum === 0}
                >
                  Next: split it →
                </button>
              </>
            )}

            {/* Step 2: split */}
            {step === 2 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--ink-muted)', padding: 0 }}
                  >←</button>
                  <div>
                    <h3 style={{ fontSize: 15 }}>Split ₩{amountNum.toLocaleString()}</h3>
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{description}</p>
                  </div>
                </div>

                {/* Split type toggle */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {['equal', 'custom'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSplitType(t)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 10,
                        border: '1.5px solid',
                        borderColor: splitType === t ? 'var(--ink)' : 'var(--cream-border)',
                        background: splitType === t ? 'var(--ink)' : 'transparent',
                        color: splitType === t ? '#FAFAF7' : 'var(--ink-muted)',
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {t === 'equal' ? '÷ Equal split' : '✏️ Custom'}
                    </button>
                  ))}
                </div>

                {splitType === 'equal' ? (
                  <div className="card" style={{ marginBottom: 16 }}>
                    {group.members.map(mid => (
                      <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--cream-border)' }}>
                        <Avatar user={users[mid]} size={34} />
                        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                          {mid === 'me' ? 'You' : users[mid].name}
                          {mid === paidBy && <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginLeft: 6 }}>paid</span>}
                        </span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
                          ₩{equalShare.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="card" style={{ marginBottom: 10 }}>
                      {group.members.map(mid => (
                        <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--cream-border)' }}>
                          <Avatar user={users[mid]} size={34} />
                          <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                            {mid === 'me' ? 'You' : users[mid].name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: 'var(--ink-muted)', fontSize: 14 }}>₩</span>
                            <input
                              style={{
                                width: 80, padding: '6px 8px',
                                border: '1.5px solid var(--cream-border)', borderRadius: 8,
                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                                textAlign: 'right', outline: 'none',
                              }}
                              inputMode="numeric"
                              value={customSplits[mid] || ''}
                              onChange={e => setCustomSplits(prev => ({ ...prev, [mid]: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                      background: customRemaining === 0 ? 'var(--green-light)' : customRemaining < 0 ? '#FEE2E2' : 'var(--amber-light)',
                    }}>
                      <span style={{
                        fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700,
                        color: customRemaining === 0 ? 'var(--green-dark)' : customRemaining < 0 ? '#B91C1C' : 'var(--amber-dark)',
                      }}>
                        {customRemaining === 0
                          ? '✓ Amounts add up'
                          : customRemaining > 0
                            ? `₩${customRemaining.toLocaleString()} still to assign`
                            : `₩${(-customRemaining).toLocaleString()} over total`}
                      </span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--ink-muted)' }}>
                        ₩{customTotal.toLocaleString()} / ₩{amountNum.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}

                <button
                  className="btn btn-green btn-full"
                  onClick={handleSubmit}
                  disabled={splitType === 'custom' && customRemaining !== 0}
                >
                  ✓ Add expense
                </button>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Import bottom sheet ── */}
      {importSheet && (
        <div className="modal-overlay" onClick={() => { if (!importing) setImportSheet(null) }}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>

            {/* Sheet header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: sourceMeta?.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ImportFileIcon color={sourceMeta?.color} />
                </div>
                <div>
                  <h3 style={{ marginBottom: 2 }}>Import from {sourceMeta?.label}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Pick a recent transaction</p>
                </div>
              </div>
              {!importing && (
                <button
                  onClick={() => setImportSheet(null)}
                  style={{
                    background: 'var(--cream-dark)', border: 'none', cursor: 'pointer',
                    width: 30, height: 30, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: 'var(--ink-muted)', flexShrink: 0,
                  }}
                >×</button>
              )}
            </div>

            {/* Sheet content */}
            {importing ? (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📲</div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>
                  Importing transaction…
                </p>
              </div>
            ) : (
              sheetItems.map((mock, i) => (
                <div
                  key={i}
                  className="card"
                  style={{ marginBottom: 10, cursor: 'pointer' }}
                  onClick={() => handleImportPick(mock)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, background: 'var(--cream-dark)',
                      borderRadius: 12, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 20, flexShrink: 0,
                    }}>
                      {CATEGORY_META[mock.category]?.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                        {mock.description}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                        ₩{mock.amount.toLocaleString()}
                      </p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
