import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { FunnelProvider } from './context/FunnelContext'
import { PricingConfigProvider } from './context/PricingConfigContext'
import { ServiceAreasProvider } from './context/ServiceAreasContext'
import { AuthProvider } from './context/AuthContext'
import { MockBookingsProvider } from './context/MockBookingsContext'
import { ChatProvider } from './context/ChatContext'
import { BookingModalProvider } from './context/BookingModalContext'
import { FunnelGuard } from './components/FunnelGuard'
import { ScrollToTop } from './components/ScrollToTop'
import { ChatWidget } from './components/ChatWidget'
import { TabShell } from './layouts/TabShell'
import { Home } from './screens/Home'
import { InstantQuote } from './screens/InstantQuote'

const Bookings = lazy(() => import('./screens/Bookings').then((m) => ({ default: m.Bookings })))
const MockBookingDetail = lazy(() => import('./screens/MockBookingDetail').then((m) => ({ default: m.MockBookingDetail })))
const Chat = lazy(() => import('./screens/Chat').then((m) => ({ default: m.Chat })))
const Profile = lazy(() => import('./screens/Profile').then((m) => ({ default: m.Profile })))
const EditProfile = lazy(() => import('./screens/EditProfile').then((m) => ({ default: m.EditProfile })))
const Notifications = lazy(() => import('./screens/Notifications').then((m) => ({ default: m.Notifications })))
const Onboarding = lazy(() => import('./screens/Onboarding').then((m) => ({ default: m.Onboarding })))
const Login = lazy(() => import('./screens/Login').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('./screens/Signup').then((m) => ({ default: m.Signup })))
const ForgotPassword = lazy(() => import('./screens/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('./screens/ResetPassword').then((m) => ({ default: m.ResetPassword })))
const Contact = lazy(() => import('./screens/Contact').then((m) => ({ default: m.Contact })))
const PrivacyPolicy = lazy(() => import('./screens/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })))
const TermsOfService = lazy(() => import('./screens/TermsOfService').then((m) => ({ default: m.TermsOfService })))
const Schedule = lazy(() => import('./screens/Schedule').then((m) => ({ default: m.Schedule })))
const Details = lazy(() => import('./screens/Details').then((m) => ({ default: m.Details })))
const Photos = lazy(() => import('./screens/Photos').then((m) => ({ default: m.Photos })))
const Pay = lazy(() => import('./screens/Pay').then((m) => ({ default: m.Pay })))
const Confirmed = lazy(() => import('./screens/Confirmed').then((m) => ({ default: m.Confirmed })))
const BookingDetail = lazy(() => import('./screens/BookingDetail').then((m) => ({ default: m.BookingDetail })))

function RouteFallback() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <PricingConfigProvider>
      <ServiceAreasProvider>
        <AuthProvider>
          <MockBookingsProvider>
            <ChatProvider>
              <FunnelProvider>
                <BookingModalProvider>
                <ScrollToTop />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />

                    <Route element={<TabShell />}>
                      <Route path="/home" element={<Home />} />
                      <Route path="/bookings" element={<Bookings />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/profile" element={<Profile />} />
                    </Route>

                    <Route path="/bookings/:mockId" element={<MockBookingDetail />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />

                    <Route path="/quote" element={<InstantQuote />} />
                    <Route
                      path="/schedule"
                      element={
                        <FunnelGuard requires="schedule">
                          <Schedule />
                        </FunnelGuard>
                      }
                    />
                    <Route
                      path="/details"
                      element={
                        <FunnelGuard requires="details">
                          <Details />
                        </FunnelGuard>
                      }
                    />
                    <Route
                      path="/photos"
                      element={
                        <FunnelGuard requires="photos">
                          <Photos />
                        </FunnelGuard>
                      }
                    />
                    <Route
                      path="/pay"
                      element={
                        <FunnelGuard requires="pay">
                          <Pay />
                        </FunnelGuard>
                      }
                    />
                    <Route path="/confirmed/:bookingId" element={<Confirmed />} />
                    <Route path="/booking/:bookingId" element={<BookingDetail />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
                <ChatWidget />
                </BookingModalProvider>
              </FunnelProvider>
            </ChatProvider>
          </MockBookingsProvider>
        </AuthProvider>
      </ServiceAreasProvider>
    </PricingConfigProvider>
  )
}
