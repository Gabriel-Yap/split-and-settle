import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext.jsx'
import { USERS } from '../data/seed.js'

const EMOJIS = ['🍊', '🎂', '🏠', '✈️', '🎉', '🍻', '🎁', '🏕️', '🎵', '🐾']
const INVITE_LINK = 'https://splitandsettle.app/join/abc123'

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function UserPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function NewGroup() {
  const { addGroup } = useApp()
  const navigate = useNavigate()
  const [name, setName]                     = useState('')
  const [emoji, setEmoji]                   = useState('🎉')
  const [selectedMembers, setSelectedMembers] = useState(['me'])
  const [search, setSearch]                 = useState('')
  const [toastVisible, setToastVisible]     = useState(false)
  const [toastFading, setToastFading]       = useState(false)

  const fadeTimer = useRef(null)
  const hideTimer = useRef(null)

  useEffect(() => () => {
    clearTimeout(fadeTimer.current)
    clearTimeout(hideTimer.current)
  }, [])

  const friends         = Object.values(USERS).filter(u => u.id !== 'me')
  const filteredFriends = search.trim()
    ? friends.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
    : friends
  const showInviteRow   = search.trim().length > 0 && filteredFriends.length === 0

  function toggleMember(id) {
    if (id === 'me') return
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  function handleInvite() {
    navigator.clipboard.writeText(INVITE_LINK).catch(() => {})
    clearTimeout(fadeTimer.current)
    clearTimeout(hideTimer.current)
    setToastFading(false)
    setToastVisible(true)
    fadeTimer.current = setTimeout(() => setToastFading(true), 2500)
    hideTimer.current = setTimeout(() => setToastVisible(false), 3100)
  }

  function handleCreate() {
    if (!name.trim() || selectedMembers.length < 2) return
    addGroup({
      id: `g${Date.now()}`,
      name: `${name} ${emoji}`,
      emoji,
      members: selectedMembers,
      createdAt: new Date().toISOString().split('T')[0],
      expenses: [],
      settlements: [],
      settleRequests: [],
    })
    navigate('/')
  }

  return (
    <div className="screen" style={{ paddingTop: 0 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'var(--ink)', margin: '0 -18px',
        padding: '52px 22px 24px', borderRadius: '0 0 24px 24px',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,251,245,0.6)', fontSize: 24, marginBottom: 12, padding: 0 }}
        >←</button>
        <h2 style={{ color: '#FAFAF7', fontSize: 20 }}>New group</h2>
      </div>

      <div style={{ marginTop: 24 }}>

        {/* ── Emoji picker ── */}
        <div className="input-wrap" style={{ marginBottom: 16 }}>
          <label className="input-label">Pick an emoji</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: '1.5px solid',
                  borderColor: emoji === e ? 'var(--amber)' : 'var(--cream-border)',
                  background: emoji === e ? 'var(--amber-light)' : 'var(--card-bg)',
                  fontSize: 22, cursor: 'pointer',
                }}
              >{e}</button>
            ))}
          </div>
        </div>

        {/* ── Group name ── */}
        <div className="input-wrap" style={{ marginBottom: 20 }}>
          <label className="input-label">Group name</label>
          <input
            className="input"
            placeholder="e.g. Busan Road Trip"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* ── Add friends ── */}
        <div style={{ marginBottom: 16 }}>
          <label className="input-label" style={{ display: 'block', marginBottom: 8 }}>
            Add friends
          </label>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{
              position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--ink-muted)', pointerEvents: 'none',
              display: 'flex', alignItems: 'center',
            }}>
              <SearchIcon />
            </span>
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              placeholder="Search by name, phone or KakaoTalk ID"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* "Suggested" section label */}
          <p style={{
            fontSize: 11, color: 'var(--ink-muted)',
            fontFamily: 'var(--font-body)', fontWeight: 600,
            letterSpacing: '0.5px', textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Suggested
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Me — always shown, not searchable */}
            <div className="card" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', opacity: 0.6,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: USERS.me.bg, color: USERS.me.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800,
              }}>나</div>
              <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                You (always included)
              </span>
              <span style={{ color: 'var(--green-dark)', fontSize: 18 }}>✓</span>
            </div>

            {/* Filtered friend rows */}
            {filteredFriends.map(u => {
              const selected = selectedMembers.includes(u.id)
              return (
                <div
                  key={u.id}
                  className="card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', cursor: 'pointer',
                    borderColor: selected ? 'var(--amber)' : 'var(--cream-border)',
                  }}
                  onClick={() => toggleMember(u.id)}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: u.bg, color: u.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                  }}>{u.initials}</div>
                  <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                    {u.name}
                  </span>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', border: '2px solid',
                    borderColor: selected ? 'var(--green)' : 'var(--cream-border)',
                    background: selected ? 'var(--green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <span style={{ color: '#fff', fontSize: 13 }}>✓</span>}
                  </div>
                </div>
              )
            })}

            {/* No match → invite-by-name row */}
            {showInviteRow && (
              <div
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', cursor: 'pointer',
                  borderColor: 'var(--blue)', borderWidth: '1.5px',
                }}
                onClick={handleInvite}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'var(--blue-light)', color: 'var(--blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UserPlusIcon />
                </div>
                <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  Invite <span style={{ color: 'var(--blue)' }}>{search.trim()}</span> via link
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* ── Copy invite link button ── */}
        <button
          className="btn btn-ghost btn-full"
          style={{ gap: 8, marginBottom: 8 }}
          onClick={handleInvite}
        >
          <LinkIcon />
          Copy invite link
        </button>

        {/* ── Invite note ── */}
        <p style={{
          textAlign: 'center', fontSize: 12,
          color: 'var(--ink-muted)', marginBottom: 24,
        }}>
          Anyone with the link can join this group
        </p>

        {/* Validation hint */}
        {(!name.trim() || selectedMembers.length < 2) && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-muted)', marginBottom: 10 }}>
            {!name.trim() ? 'Enter a group name' : 'Select at least one friend'}
          </p>
        )}

        <button
          className="btn btn-primary btn-full"
          disabled={!name.trim() || selectedMembers.length < 2}
          onClick={handleCreate}
        >
          Create group →
        </button>
      </div>

      {/* ── Toast ── */}
      {toastVisible && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300, pointerEvents: 'none',
          maxWidth: 360, width: 'calc(100% - 40px)',
        }}>
          <div style={{
            background: 'var(--ink)', color: '#FAFAF7',
            padding: '13px 18px', borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
            animation: 'toastSlideUp 0.28s ease both',
            opacity: toastFading ? 0 : 1,
            transition: toastFading ? 'opacity 0.55s ease' : 'none',
          }}>
            <span style={{ color: '#4ADE80', flexShrink: 0, display: 'flex' }}>
              <CheckIcon />
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14 }}>
              Link copied — send it to your friends
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
