import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TabShell } from './layouts/TabShell'
import { Splash } from './screens/Splash'
import { Login } from './screens/Login'
import { Signup } from './screens/Signup'
import { ForgotPassword } from './screens/ForgotPassword'
import { ResetPassword } from './screens/ResetPassword'
import { Application } from './screens/Application'
import { Verification } from './screens/Verification'
import { Agreement } from './screens/Agreement'
import { Pending } from './screens/Pending'
import { GigFeed } from './screens/GigFeed'
import { MyJobs } from './screens/MyJobs'
import { Earnings } from './screens/Earnings'

/** Routes which stage of onboarding a signed-in cleaner is on, or the
 * unlocked feed once approved + agreement signed. */
function Gate() {
  const { cleaner } = useAuth()

  if (!cleaner) return <Splash />
  if (cleaner.towns.length === 0) return <Application />
  if (!cleaner.verificationSubmittedAt) return <Verification />
  if (!cleaner.agreementSignedAt) return <Agreement />
  if (cleaner.status !== 'active') return <Pending status={cleaner.status} />

  return (
    <TabShell>
      <Routes>
        <Route index element={<GigFeed />} />
        <Route path="my-jobs" element={<MyJobs />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TabShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={<Gate />} />
      </Routes>
    </AuthProvider>
  )
}
