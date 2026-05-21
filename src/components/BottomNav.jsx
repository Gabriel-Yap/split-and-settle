import { useNavigate, useLocation } from 'react-router-dom'

function IconGroups({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconActivity({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

const TABS = [
  { path: '/',         Icon: IconGroups,   label: 'Groups'   },
  { path: '/activity', Icon: IconActivity, label: 'Activity' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const hideOn = ['/new-group', '/payment-methods']
  const isDeep = pathname.includes('/group/') || hideOn.includes(pathname)
  if (isDeep) return null

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {TABS.map(({ path, Icon, label }) => {
        const active = pathname === path
        return (
          <button
            key={path}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(path)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon">
              <Icon active={active} />
            </span>
            {label}
          </button>
        )
      })}
    </nav>
  )
}
