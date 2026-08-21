import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'

export function Chat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { messages, sendMessage } = useChat()
  const [draft, setDraft] = useState('')

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-8">
        <h1 className="font-heading text-2xl font-extrabold text-foreground mb-8">Support</h1>
        <div className="flex flex-col items-center text-center gap-4 py-16">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <Icon icon="solar:chat-round-line-linear" className="text-secondary text-3xl" />
          </div>
          <p className="text-muted-foreground text-sm max-w-xs">Sign in to chat with our support team.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="bg-primary text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 flex flex-col h-[calc(100vh-9rem)] sm:h-[calc(100vh-10rem)]">
      <h1 className="font-heading text-2xl font-extrabold text-foreground mb-6">Support</h1>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-[20px] px-5 py-3 text-sm leading-relaxed ${
                m.from === 'user'
                  ? 'bg-secondary text-white rounded-br-md'
                  : 'bg-card border border-border text-foreground rounded-bl-md'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-2 pb-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 min-h-11 bg-card border border-border rounded-full px-5 py-3 text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none shadow-sm"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform shrink-0"
        >
          <Icon icon="solar:arrow-up-linear" className="text-xl" />
        </button>
      </form>
    </div>
  )
}
