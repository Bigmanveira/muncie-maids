import { Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Shell } from './layouts/Shell'
import { Login } from './screens/Login'
import { Signup } from './screens/Signup'
import { ForgotPassword } from './screens/ForgotPassword'
import { ResetPassword } from './screens/ResetPassword'
import { Unauthorized } from './screens/Unauthorized'
import { Dashboard } from './screens/Dashboard'
import { Analytics } from './screens/Analytics'
import { Bookings } from './screens/Bookings'
import { Cleaners } from './screens/Cleaners'
import { Payouts } from './screens/Payouts'

function Gate() {
  const { status } = useAuth()

  if (status === 'signed-out') return <Login />
  if (status === 'unauthorized') return <Unauthorized />

  return (
    <Shell>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="cleaners" element={<Cleaners />} />
        <Route path="payouts" element={<Payouts />} />
      </Routes>
    </Shell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={<Gate />} />
      </Routes>
    </AuthProvider>
  )
}
