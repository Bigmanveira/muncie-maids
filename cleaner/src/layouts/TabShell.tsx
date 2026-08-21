import type { ReactNode } from 'react'
import { BottomTabBar } from '../components/BottomTabBar'

export function TabShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background pb-28 sm:pb-32">
      {children}
      <BottomTabBar />
    </div>
  )
}
