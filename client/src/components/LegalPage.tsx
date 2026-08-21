import { Icon } from '@iconify/react'
import type { ReactNode } from 'react'
import { SimpleHeader } from './SimpleHeader'

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <SimpleHeader title={title} />
      <div className="px-6 py-6 max-w-2xl mx-auto">
        <div className="rounded-2xl bg-chart-4/10 border border-chart-4/20 p-4 flex items-start gap-3 mb-8">
          <Icon icon="solar:document-text-bold" className="text-chart-4 text-xl shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            <span className="font-bold">Draft — pending attorney review.</span> This document has not yet been
            reviewed by counsel and should not be treated as final or legally binding.
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-8">Last updated {updated}</p>
        <div className="space-y-8 text-sm text-foreground leading-relaxed [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:mb-3 [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-3">
          {children}
        </div>
      </div>
    </div>
  )
}
