import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/',         icon: '🏠', label: 'Groups'   },
  { path: '/activity', icon: '📋', label: 'Activity'  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Hide on deep screens
  const hideOn = ['/new-group']
  const isDeep = pathname.includes('/group/') || hideOn.includes(pathname)
  if (isDeep) return null

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {TABS.map(tab => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
