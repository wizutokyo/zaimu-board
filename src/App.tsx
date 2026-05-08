import { HashRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/layout/BottomNav'
import { Dashboard } from './pages/Dashboard'
import { TransactionInput } from './pages/TransactionInput'
import { PLReport } from './pages/PLReport'
import { BSReport } from './pages/BSReport'
import { Analysis } from './pages/Analysis'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <div className="max-w-md mx-auto relative">
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/input"    element={<TransactionInput />} />
          <Route path="/pl"       element={<PLReport />} />
          <Route path="/bs"       element={<BSReport />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  )
}
