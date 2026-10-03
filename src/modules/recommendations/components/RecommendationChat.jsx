import { useEffect, useRef, useState } from 'react'
import { AIServiceError } from '../../../services/aiClient.js'
import {
  createRecommendationChatSessionId,
  sendRecommendationChatMessage,
} from '../../../services/recommendations/recommendationChatService.js'
import {
  clearPersonalGeminiKey,
  clearPersonalGeminiKeyPreference,
  readPersonalGeminiKey,
  readPersonalGeminiKeyPreference,
  savePersonalGeminiKey,
} from '../../../services/recommendations/personalGeminiKeyStorage.js'
import '../recommendations.css'

const ERROR_MESSAGES = {
  configuration: 'El chatbot todavía no está configurado en este equipo.',
  'rate-limited': 'Has enviado varios mensajes. Espera un momento antes de continuar.',
  timeout: 'El chatbot tardó demasiado. Inténtalo nuevamente.',
  network: 'No pudimos conectar con el chatbot. Comprueba que FilmDNA y n8n estén activos.',
  'invalid-response': 'El chatbot devolvió una respuesta no válida.',
  unavailable: 'El chatbot no está disponible temporalmente.',
}

const getErrorMessage = (error) => ERROR_MESSAGES[error instanceof AIServiceError ? error.type : 'invalid-response'] || ERROR_MESSAGES.unavailable

function RecommendationChat({ filters, movies, onAction }) {
  const sessionId = useRef(createRecommendationChatSessionId())
  const inputRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [suggestions, setSuggestions] = useState(['Quiero algo divertido', 'Algo corto para hoy', 'Sorpréndeme'])
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [apiKey, setApiKey] = useState(readPersonalGeminiKey)
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [keyDraft, setKeyDraft] = useState('')
  const [keyDecision, setKeyDecision] = useState(() => readPersonalGeminiKeyPreference() || { mode: 'memory', dontAsk: false })
  const [keyError, setKeyError] = useState('')

  const send = async (text) => {
    const message = String(text || '').trim()
    if (!message || status.type === 'loading') return
    const history = messages.map(({ role, text: itemText }) => ({ role, text: itemText }))
    const userMessage = { role: 'user', text: message }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setStatus({ type: 'loading', message: 'FilmDNA está pensando…' })
    try {
      const response = await sendRecommendationChatMessage({
        sessionId: sessionId.current,
        message,
        history,
        filters,
        movies,
        turn: history.length,
        apiKey,
      })
      if (response.action === 'reset') {
        sessionId.current = createRecommendationChatSessionId()
        setMessages([])
        setStatus({ type: 'success', message: response.reply })
      } else {
        setMessages((current) => [...current, { role: 'assistant', text: response.reply }])
        setStatus({ type: 'idle', message: '' })
      }
      setSuggestions(response.suggestedReplies)
      onAction(response)
    } catch (error) {
      setMessages((current) => current.filter((item) => item !== userMessage))
      setStatus({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const submit = (event) => {
    event.preventDefault()
    send(input)
  }

  const saveKey = (event) => {
    event.preventDefault()
    try {
      const key = savePersonalGeminiKey(keyDraft, keyDecision)
      setApiKey(key)
      setKeyDraft('')
      setKeyError('')
      setKeyDialogOpen(false)
    } catch {
      setKeyError('Introduce una API key válida de Gemini (mínimo 20 caracteres).')
    }
  }

  const removeKey = () => {
    clearPersonalGeminiKey()
    setApiKey('')
    setKeyDraft('')
    setKeyError('')
  }

  const forgetDecision = () => {
    clearPersonalGeminiKeyPreference()
    setKeyDecision({ mode: 'memory', dontAsk: false })
  }

  useEffect(() => {
    if (!expanded) return undefined
    inputRef.current?.focus()
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      if (keyDialogOpen) setKeyDialogOpen(false)
      else setExpanded(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [expanded, keyDialogOpen])

  return (
    <div className="recommendation-chat">
      <button type="button" className="recommendation-chat__launcher" aria-expanded={expanded} aria-controls="recommendation-chat-panel" onClick={() => setExpanded((value) => !value)}>
        <span aria-hidden="true">✦</span> Chat FilmDNA
      </button>

      {expanded ? <section id="recommendation-chat-panel" className="recommendation-chat__panel" role="dialog" aria-modal="false" aria-labelledby="recommendation-chat-title">
        <header className="recommendation-chat__header">
          <div>
            <p className="eyebrow"><span aria-hidden="true" />Copiloto cinematográfico</p>
            <h2 id="recommendation-chat-title">Habla con FilmDNA</h2>
            <p>Pide ideas, aclara lo que buscas o ajusta tus resultados conversando.</p>
          </div>
          <div className="recommendation-chat__header-actions">
            <button type="button" className="recommendation-chat__key-button" aria-label="Configurar API key personal" onClick={() => setKeyDialogOpen(true)}>{apiKey ? 'API personal activa' : 'Configurar API'}</button>
            <button type="button" className="recommendation-chat__close" aria-label="Cerrar chat" onClick={() => setExpanded(false)}>×</button>
          </div>
        </header>

        <div className="recommendation-chat__messages" role="log" aria-live="polite" aria-label="Conversación con FilmDNA">
          {messages.length === 0 ? <div className="recommendation-chat__welcome"><strong>¿Qué te gustaría ver?</strong><p>No necesito datos personales: cuéntame género, duración, compañía o cómo quieres sentirte.</p></div> : null}
          {messages.map((item, index) => <div className={`recommendation-chat__message recommendation-chat__message--${item.role}`} key={`${item.role}-${index}`}><span>{item.role === 'user' ? 'Tú' : 'FilmDNA'}</span><p>{item.text}</p></div>)}
          {status.message ? <p className={`recommendation-chat__status recommendation-chat__status--${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p> : null}
        </div>

        {suggestions.length > 0 ? <div className="recommendation-chat__suggestions" aria-label="Respuestas sugeridas">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => send(suggestion)} disabled={status.type === 'loading'}>{suggestion}</button>)}</div> : null}

        <form className="recommendation-chat__form" onSubmit={submit}>
          <label className="visually-hidden" htmlFor="recommendation-chat-input">Mensaje para FilmDNA</label>
          <textarea ref={inputRef} id="recommendation-chat-input" rows="2" maxLength="500" placeholder="Ej.: quiero una película divertida y corta para ver con amigos" value={input} onChange={(event) => setInput(event.target.value)} disabled={status.type === 'loading'} />
          <button className="button button--primary" type="submit" disabled={!input.trim() || status.type === 'loading'}>{status.type === 'loading' ? 'Enviando…' : 'Enviar'}</button>
        </form>
        <small className="recommendation-chat__privacy">La conversación es temporal y no incluye tu correo, historial emocional ni notas privadas.</small>
        {keyDialogOpen ? <div className="recommendation-chat__key-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setKeyDialogOpen(false) }}>
          <form className="recommendation-chat__key-dialog" role="dialog" aria-modal="true" aria-labelledby="personal-key-title" onSubmit={saveKey}>
            <header><div><h3 id="personal-key-title">API key personal de Gemini</h3><p>Se envía al servidor en un encabezado separado y nunca se añade al chat ni a n8n.</p></div><button type="button" aria-label="Cerrar configuración de API" onClick={() => setKeyDialogOpen(false)}>×</button></header>
            <label>API key<input type="password" autoComplete="off" value={keyDraft} onChange={(event) => { setKeyDraft(event.target.value); setKeyError('') }} placeholder={apiKey ? 'Hay una clave configurada' : 'Pega tu clave de Google AI Studio'} /></label>
            <fieldset><legend>¿Quieres guardarla?</legend>
              <label><input type="radio" name="key-storage" value="memory" checked={keyDecision.mode === 'memory'} onChange={() => setKeyDecision((current) => ({ ...current, mode: 'memory' }))} /> No guardar; usar hasta recargar la página</label>
              <label><input type="radio" name="key-storage" value="session" checked={keyDecision.mode === 'session'} onChange={() => setKeyDecision((current) => ({ ...current, mode: 'session' }))} /> Guardar hasta cerrar el navegador</label>
            </fieldset>
            <label className="recommendation-chat__key-check"><input type="checkbox" checked={keyDecision.dontAsk} onChange={(event) => setKeyDecision((current) => ({ ...current, dontAsk: event.target.checked }))} /> No volver a preguntarme esta decisión</label>
            {keyError ? <p className="recommendation-chat__key-error" role="alert">{keyError}</p> : null}
            <p className="recommendation-chat__key-warning">Por seguridad, FilmDNA no guarda la clave permanentemente en tu perfil ni en <code>db.json</code>.</p>
            <div className="recommendation-chat__key-actions">
              {apiKey ? <button type="button" className="button" onClick={removeKey}>Eliminar clave</button> : null}
              {readPersonalGeminiKeyPreference() ? <button type="button" className="button" onClick={forgetDecision}>Olvidar decisión</button> : null}
              <button type="submit" className="button button--primary" disabled={!keyDraft.trim()}>Usar esta clave</button>
            </div>
          </form>
        </div> : null}
      </section> : null}
    </div>
  )
}

export default RecommendationChat
