export const USERS = {
  me:     { id: 'me',     name: '나',     initials: '나', color: '#F5A623', bg: '#FEF3DC' },
  jihoon: { id: 'jihoon', name: 'Jihoon', initials: 'JH', color: '#3A7AE8', bg: '#EBF1FD' },
  soyeon: { id: 'soyeon', name: 'Soyeon', initials: 'SY', color: '#2EAF72', bg: '#E3F7EE' },
  minjae: { id: 'minjae', name: 'Minjae', initials: 'MJ', color: '#7C4DFF', bg: '#F0EBFF' },
  yuna:   { id: 'yuna',   name: 'Yuna',   initials: 'YN', color: '#E8523A', bg: '#FDECE9' },
}

export const INITIAL_GROUPS = []

export const SEED_GROUPS = [
  {
    id: 'jeju',
    name: 'Jeju Trip 🍊',
    emoji: '🍊',
    members: ['me', 'jihoon', 'soyeon', 'minjae'],
    createdAt: '2024-03-10',
    // Old per-expense payments converted to group-level settlements
    settlements: [
      { from: 'soyeon', to: 'me',     amount: 60000, date: '2024-03-16' },
      { from: 'me',     to: 'soyeon', amount: 30000, date: '2024-03-15' },
      { from: 'jihoon', to: 'soyeon', amount: 30000, date: '2024-03-15' },
      { from: 'minjae', to: 'soyeon', amount: 30000, date: '2024-03-15' },
      { from: 'me',     to: 'minjae', amount: 3000,  date: '2024-03-15' },
      { from: 'jihoon', to: 'minjae', amount: 3000,  date: '2024-03-15' },
      { from: 'soyeon', to: 'minjae', amount: 3000,  date: '2024-03-15' },
    ],
    expenses: [
      {
        id: 'e1', description: 'Airbnb — 3 nights', amount: 240000,
        paidBy: 'me', category: 'stay', date: '2024-03-14',
        split: { me: 60000, jihoon: 60000, soyeon: 60000, minjae: 60000 },
      },
      {
        id: 'e2', description: 'Black pork BBQ', amount: 96000,
        paidBy: 'jihoon', category: 'food', date: '2024-03-14',
        split: { me: 24000, jihoon: 24000, soyeon: 24000, minjae: 24000 },
      },
      {
        id: 'e3', description: 'Rental car', amount: 120000,
        paidBy: 'soyeon', category: 'transport', date: '2024-03-15',
        split: { me: 30000, jihoon: 30000, soyeon: 30000, minjae: 30000 },
      },
      {
        id: 'e4', description: 'Hallasan entry tickets', amount: 12000,
        paidBy: 'minjae', category: 'activity', date: '2024-03-15',
        split: { me: 3000, jihoon: 3000, soyeon: 3000, minjae: 3000 },
      },
    ],
  },
  {
    id: 'birthday',
    name: "Yuna's Birthday 🎂",
    emoji: '🎂',
    members: ['me', 'jihoon', 'soyeon', 'yuna'],
    createdAt: '2024-04-01',
    settlements: [],
    expenses: [
      {
        id: 'e5', description: 'Birthday cake — Paris Baguette', amount: 45000,
        paidBy: 'me', category: 'food', date: '2024-04-05',
        split: { me: 15000, jihoon: 15000, soyeon: 15000 },
      },
      {
        id: 'e6', description: 'Gift — Dyson Airwrap (Naver)', amount: 189000,
        paidBy: 'jihoon', category: 'gift', date: '2024-04-05',
        split: { me: 63000, jihoon: 63000, soyeon: 63000 },
      },
    ],
  },
  {
    id: 'apartment',
    name: 'Apartment 302 🏠',
    emoji: '🏠',
    members: ['me', 'minjae'],
    createdAt: '2024-01-01',
    settlements: [
      { from: 'minjae', to: 'me', amount: 11500, date: '2024-04-02' },
    ],
    expenses: [
      {
        id: 'e7', description: 'Netflix + Watcha shared', amount: 23000,
        paidBy: 'me', category: 'subscription', date: '2024-04-01',
        split: { me: 11500, minjae: 11500 },
      },
      {
        id: 'e8', description: 'Internet bill — April', amount: 33000,
        paidBy: 'minjae', category: 'utilities', date: '2024-04-05',
        split: { me: 16500, minjae: 16500 },
      },
    ],
  },
]

export const CATEGORY_META = {
  food:         { emoji: '🍽️', label: 'Food & drink' },
  stay:         { emoji: '🏠', label: 'Accommodation' },
  transport:    { emoji: '🚗', label: 'Transport' },
  activity:     { emoji: '🎉', label: 'Activity' },
  gift:         { emoji: '🎁', label: 'Gift' },
  subscription: { emoji: '📺', label: 'Subscription' },
  utilities:    { emoji: '💡', label: 'Utilities' },
  other:        { emoji: '📦', label: 'Other' },
}
