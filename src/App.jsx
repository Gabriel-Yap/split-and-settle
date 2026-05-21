import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './AppContext.jsx'
import Home from './components/Home.jsx'
import GroupView from './components/GroupView.jsx'
import AddExpense from './components/AddExpense.jsx'
import SettleUp from './components/SettleUp.jsx'
import SettleRequest from './components/SettleRequest.jsx'
import NewGroup from './components/NewGroup.jsx'
import Activity from './components/Activity.jsx'
import BottomNav from './components/BottomNav.jsx'
import PaymentMethods from './components/PaymentMethods.jsx'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/"                       element={<Home />} />
          <Route path="/group/:id"              element={<GroupView />} />
          <Route path="/group/:id/add"          element={<AddExpense />} />
          <Route path="/group/:id/settle"                         element={<SettleUp />} />
          <Route path="/group/:id/settle-request/:requestId"   element={<SettleRequest />} />
          <Route path="/new-group"              element={<NewGroup />} />
          <Route path="/activity"               element={<Activity />} />
          <Route path="/payment-methods"        element={<PaymentMethods />} />
        </Routes>
        <BottomNav />
      </HashRouter>
    </AppProvider>
  )
}
