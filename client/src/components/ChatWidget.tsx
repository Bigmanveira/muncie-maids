import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

// Every funnel screen has its own fixed bottom CTA bar — the floating bubble would sit on top of it.
// /contact already has its own "Live chat" card and a full message form, so the bubble is redundant there too.
const HIDDEN_ON = ['/chat', '/quote', '/schedule', '/details', '/photos', '/pay', '/contact']
const BADGE_DELAY_MS = 1600

/** Floating chat bubble reusing the same mock ChatContext as the full /chat screen. */
export function ChatWidget() {
  const location = useLocation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { messages, sendMessage } = useChat()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [showBadge, setShowBadge] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowBadge(true), BADGE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (HIDDEN_ON.some((path) => location.pathname.startsWith(path))) return null

  function handleToggle() {
    setOpen((v) => !v)
    setShowBadge(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 w-[calc(100vw-3rem)] max-w-sm h-[28rem] bg-card border border-border rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <p className="font-bold text-foreground text-sm">Chat with us</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <Icon icon="solar:close-circle-linear" className="text-lg" />
            </button>
          </div>

          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6">
              <Icon icon="solar:chat-round-line-linear" className="text-secondary text-3xl" />
              <p className="text-muted-foreground text-sm">Sign in to chat with our support team.</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/login')
                }}
                className="bg-primary text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-[16px] px-4 py-2.5 text-sm leading-relaxed ${
                        m.from === 'user'
                          ? 'bg-secondary text-white rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-border shrink-0">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 min-h-10 bg-background border border-border rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
                >
                  <Icon icon="solar:arrow-up-linear" className="text-lg" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className="relative w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30 active:scale-95 transition-transform ml-auto chat-pop-in"
      >
        <Icon icon={open ? 'solar:close-circle-bold' : 'solar:chat-round-dots-bold'} className="text-2xl" />
        {showBadge && !open && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-chart-4 text-foreground text-xs font-extrabold flex items-center justify-center border-2 border-background badge-pop">
            1
          </span>
        )}
      </button>
    </div>
  )
}
