import { createContext, useContext, useState, type ReactNode } from 'react'

export interface ChatMessage {
  id: string
  from: 'support' | 'user'
  text: string
}

const STORAGE_KEY = 'muncie-maids-mock-chat'

const WELCOME: ChatMessage = {
  id: 'welcome',
  from: 'support',
  text: "Hi, this is Muncie Maids support. We're here Monday-Saturday, 8am-6pm. Ask us anything about your cleaning.",
}

const AUTO_REPLY = "Thanks for the message — our team responds within 2 hours during business hours."

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to seed
  }
  return [WELCOME]
}

interface ChatContextValue {
  messages: ChatMessage[]
  sendMessage: (text: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

let nextId = 1

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages)

  function persist(next: ChatMessage[]) {
    setMessages(next)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const userMessage: ChatMessage = { id: `u-${nextId++}`, from: 'user', text: trimmed }
    const withUser = [...messages, userMessage]
    persist(withUser)

    setTimeout(() => {
      const reply: ChatMessage = { id: `s-${nextId++}`, from: 'support', text: AUTO_REPLY }
      persist([...withUser, reply])
    }, 1200)
  }

  return <ChatContext.Provider value={{ messages, sendMessage }}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
