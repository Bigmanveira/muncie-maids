import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/Avatar'

const MENU_ITEMS = [
  { icon: 'solar:user-linear', label: 'Edit Profile', path: '/profile/edit' },
  { icon: 'solar:home-2-linear', label: 'Home Details', path: '/onboarding' },
  { icon: 'solar:bell-linear', label: 'Notifications', path: '/notifications' },
  { icon: 'solar:chat-round-line-linear', label: 'Help & Support', path: '/chat' },
  { icon: 'solar:shield-check-linear', label: 'Privacy Policy', path: '/privacy' },
  { icon: 'solar:document-text-linear', label: 'Terms of Service', path: '/terms' },
] as const

export function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-8">
        <h1 className="font-heading text-2xl font-extrabold text-foreground mb-8">Profile</h1>
        <div className="flex flex-col items-center text-center gap-4 py-16 mb-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Icon icon="solar:user-circle-linear" className="text-muted-foreground text-4xl" />
          </div>
          <p className="text-muted-foreground text-sm max-w-xs">Sign in to manage your account, bookings, and preferences.</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="bg-primary text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="bg-card border border-border text-foreground font-bold px-6 py-3 rounded-full shadow-sm active:scale-[0.98] transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="bg-card rounded-[24px] border border-border shadow-sm divide-y divide-border overflow-hidden">
          {MENU_ITEMS.filter((item) => item.path === '/privacy' || item.path === '/terms').map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 px-6 py-4 text-left active:bg-muted/50 transition-colors"
            >
              <Icon icon={item.icon} className="text-secondary text-xl" />
              <span className="flex-1 font-bold text-sm text-foreground">{item.label}</span>
              <Icon icon="solar:alt-arrow-right-linear" className="text-muted-foreground text-lg" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8">
      <h1 className="font-heading text-2xl font-extrabold text-foreground mb-8">Profile</h1>

      <div className="bg-card rounded-[28px] p-6 border border-border shadow-sm flex items-center gap-5 mb-8">
        <Avatar name={user.name} photoUrl={user.homeProfile.avatarDataUrl} size={64} />
        <div className="min-w-0">
          <h2 className="font-bold text-foreground text-lg truncate">{user.name}</h2>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <p className="text-sm text-muted-foreground">{user.phone}</p>
        </div>
      </div>

      {!user.homeProfile.onboardingCompleted && !user.homeProfile.onboardingSkipped && (
        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="w-full text-left bg-accent border border-primary/20 rounded-[24px] p-5 shadow-sm flex items-center gap-4 mb-8 active:scale-[0.99] transition-transform"
        >
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon icon="solar:home-smile-bold" className="text-primary text-xl" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground text-sm">Finish setting up your home</p>
            <p className="text-xs text-muted-foreground mt-0.5">Speeds up your next price and booking</p>
          </div>
          <Icon icon="solar:alt-arrow-right-linear" className="text-primary text-lg shrink-0" />
        </button>
      )}

      <div className="bg-card rounded-[24px] border border-border shadow-sm divide-y divide-border overflow-hidden mb-8">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 px-6 py-4 text-left active:bg-muted/50 transition-colors"
          >
            <Icon icon={item.icon} className="text-secondary text-xl" />
            <span className="flex-1 font-bold text-sm text-foreground">{item.label}</span>
            <Icon icon="solar:alt-arrow-right-linear" className="text-muted-foreground text-lg" />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/home')
        }}
        className="w-full flex items-center justify-center gap-2 bg-card border border-destructive/30 text-destructive font-bold py-4 rounded-full shadow-sm active:scale-[0.98] transition-all"
      >
        <Icon icon="solar:logout-2-linear" className="text-lg" />
        Log Out
      </button>
    </div>
  )
}
