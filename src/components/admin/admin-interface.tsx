'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sprout, User, Loader2, LogOut, Wrench, ChevronDown, ChevronUp } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolResults?: Array<{
    tool: string
    input: unknown
    result: { success: boolean; data?: unknown; error?: string }
  }>
}

// === LOGIN SCREEN ===
function LoginScreen({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        onLogin(password)
      } else {
        setError('Forkert adgangskode')
      }
    } catch {
      setError('Kunne ikke forbinde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2d5016] mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2d5016]">PotAlot Admin</h1>
          <p className="text-gray-500 mt-1">Log ind for at administrere</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Adgangskode"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2d5016]/30 focus:border-[#2d5016] text-lg"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full py-3 rounded-xl bg-[#2d5016] text-white font-medium disabled:opacity-50 hover:bg-[#3a6b1e] transition-colors"
          >
            {loading ? 'Logger ind...' : 'Log ind'}
          </button>
        </form>
      </div>
    </div>
  )
}

// === TOOL RESULT DISPLAY ===
function ToolResultCard({ tool, result }: {
  tool: string
  result: { success: boolean; data?: unknown; error?: string }
}) {
  const [expanded, setExpanded] = useState(false)

  const toolLabels: Record<string, string> = {
    list_seeds: 'Viste frø',
    list_plants: 'Viste planter',
    list_tasks: 'Viste opgaver',
    list_notes: 'Viste noter',
    list_guides: 'Viste guides',
    list_change_requests: 'Viste ændringsønsker',
    create_seed: 'Oprettede frø',
    update_seed: 'Opdaterede frø',
    delete_seed: 'Slettede frø',
    create_plant: 'Oprettede plante',
    update_plant: 'Opdaterede plante',
    delete_plant: 'Slettede plante',
    create_task: 'Oprettede opgave',
    complete_task: 'Fuldførte opgave',
    delete_task: 'Slettede opgave',
    create_note: 'Oprettede note',
    update_note: 'Opdaterede note',
    delete_note: 'Slettede note',
    create_guide: 'Oprettede guide',
    update_guide: 'Opdaterede guide',
    create_change_request: 'Oprettede ændringsønske',
  }

  const label = toolLabels[tool] || tool

  return (
    <div className={`rounded-lg border text-sm ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <Wrench className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
        <span className={`flex-1 font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
          {label}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {expanded && result.data != null && (
        <div className="px-3 pb-2 text-xs text-gray-600 overflow-x-auto">
          <pre className="whitespace-pre-wrap">{JSON.stringify(result.data, null, 2) as string}</pre>
        </div>
      )}
      {result.error && (
        <div className="px-3 pb-2 text-xs text-red-600">{result.error}</div>
      )}
    </div>
  )
}

// === CHAT SCREEN ===
function AdminChatScreen({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMessage: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages([...newMessages, { role: 'assistant', content: '...' }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages([...newMessages, {
          role: 'assistant',
          content: err.error || 'Der opstod en fejl.',
        }])
        return
      }

      const data = await res.json()
      setMessages([...newMessages, {
        role: 'assistant',
        content: data.response,
        toolResults: data.toolResults,
      }])
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Kunne ikke forbinde til serveren.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }

  const suggestions = [
    'Vis alle mine frø',
    'Tilføj et nyt frø',
    'Vis opgaver for denne uge',
    'Opret en dyrkningsguide',
  ]

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2d5016] flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-[#2d5016] text-sm">PotAlot Admin</h1>
            <p className="text-xs text-gray-400">AI Assistent</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-gray-600" title="Log ud">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2d5016]/10 flex items-center justify-center mb-4">
              <Sprout className="w-8 h-8 text-[#2d5016]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Hej Anna!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Skriv hvad du vil ændre, så klarer jeg det.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:border-[#2d5016] hover:text-[#2d5016] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#2d5016] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sprout className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#2d5016] text-white'
                    : 'bg-white border border-gray-100 text-gray-800'
                }`}
              >
                {msg.content === '...' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-gray-600" />
                </div>
              )}
            </div>

            {/* Tool results */}
            {msg.toolResults && msg.toolResults.length > 0 && (
              <div className="ml-9 mt-2 space-y-1.5">
                {msg.toolResults.map((tr, j) => (
                  <ToolResultCard key={j} tool={tr.tool} result={tr.result as { success: boolean; data?: unknown; error?: string }} />
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Skriv til PotAlot..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5016]/30 focus:border-[#2d5016]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-[#2d5016] text-white disabled:opacity-50 hover:bg-[#3a6b1e] transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

// === MAIN INTERFACE ===
export function AdminInterface() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('potalot-admin-pw')
    if (stored) {
      setPassword(stored)
      setIsAuthenticated(true)
    }
  }, [])

  function handleLogin(pw: string) {
    sessionStorage.setItem('potalot-admin-pw', pw)
    setPassword(pw)
    setIsAuthenticated(true)
  }

  function handleLogout() {
    sessionStorage.removeItem('potalot-admin-pw')
    setPassword('')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return <AdminChatScreen password={password} onLogout={handleLogout} />
}
