import { useRef, useState } from 'react'
import { AIServiceError } from '../../../services/aiClient.js'
import {
  createRecommendationChatSessionId,
  sendRecommendationChatMessage,
} from '../../../services/recommendations/recommendationChatService.js'

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
  const [expanded, setExpanded] = useState(true)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [suggestions, setSuggestions] = useState(['Quiero algo divertido', 'Algo corto para hoy', 'Sorpréndeme'])
  const [status, setStatus] = useState({ type: 'idle', message: '' })

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

  return (
    <section className="recommendation-chat" aria-labelledby="recommendation-chat-title">
      <header className="recommendation-chat__header">
        <div>
          <p className="eyebrow"><span aria-hidden="true" />Copiloto cinematográfico</p>
          <h2 id="recommendation-chat-title">Habla con FilmDNA</h2>
          <p>Pide ideas, aclara lo que buscas o ajusta tus resultados conversando.</p>
        </div>
        <button type="button" className="recommendation-chat__toggle" aria-expanded={expanded} aria-controls="recommendation-chat-panel" onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Ocultar chat' : 'Abrir chat'}
        </button>
      </header>

      {expanded ? <div id="recommendation-chat-panel" className="recommendation-chat__panel">
        <div className="recommendation-chat__messages" role="log" aria-live="polite" aria-label="Conversación con FilmDNA">
          {messages.length === 0 ? <div className="recommendation-chat__welcome"><strong>¿Qué te gustaría ver?</strong><p>No necesito datos personales: cuéntame género, duración, compañía o cómo quieres sentirte.</p></div> : null}
          {messages.map((item, index) => <div className={`recommendation-chat__message recommendation-chat__message--${item.role}`} key={`${item.role}-${index}`}><span>{item.role === 'user' ? 'Tú' : 'FilmDNA'}</span><p>{item.text}</p></div>)}
          {status.message ? <p className={`recommendation-chat__status recommendation-chat__status--${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p> : null}
        </div>

        {suggestions.length > 0 ? <div className="recommendation-chat__suggestions" aria-label="Respuestas sugeridas">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => send(suggestion)} disabled={status.type === 'loading'}>{suggestion}</button>)}</div> : null}

        <form className="recommendation-chat__form" onSubmit={submit}>
          <label className="visually-hidden" htmlFor="recommendation-chat-input">Mensaje para FilmDNA</label>
          <textarea id="recommendation-chat-input" rows="2" maxLength="500" placeholder="Ej.: quiero una película divertida y corta para ver con amigos" value={input} onChange={(event) => setInput(event.target.value)} disabled={status.type === 'loading'} />
          <button className="button button--primary" type="submit" disabled={!input.trim() || status.type === 'loading'}>{status.type === 'loading' ? 'Enviando…' : 'Enviar'}</button>
        </form>
        <small className="recommendation-chat__privacy">La conversación es temporal y no incluye tu correo, historial emocional ni notas privadas.</small>
      </div> : null}
    </section>
  )
}

export default RecommendationChat
