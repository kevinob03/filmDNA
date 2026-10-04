import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTour } from '../../context/TourContext.jsx'
import './tour-guide.css'

export function TourButton() {
  const { completed, start } = useTour()
  const label = completed ? 'Repetir tutorial de FilmDNA' : 'Iniciar tutorial de FilmDNA'
  return <button className="tour-trigger" data-tour="trigger" type="button" onClick={start} aria-label={label}>
    <span aria-hidden="true">?</span> {completed ? 'Repetir tutorial' : 'Tutorial'}
  </button>
}

export function TourGuide() {
  const { active, step, stepIndex, total, next, previous, skip, finish } = useTour()
  const navigate = useNavigate()
  const location = useLocation()
  const dialogRef = useRef(null)
  const wasActive = useRef(active)
  const [rect, setRect] = useState(null)

  const findVisibleTarget = (selector) => {
    if (!selector) return null
    return [...document.querySelectorAll(selector)].find((element) => {
      const bounds = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      return bounds.width > 0 && bounds.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }) ?? null
  }

  useEffect(() => {
    if (!active) return undefined
    if (location.pathname !== step.path) {
      setRect(null)
      navigate(step.path)
      return undefined
    }
    let attempts = 0
    let timer
    const locate = () => {
      const target = findVisibleTarget(step.selector)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        window.requestAnimationFrame(() => setRect(target.getBoundingClientRect()))
      } else if (step.selector && attempts < 20) {
        attempts += 1
        timer = window.setTimeout(locate, 100)
      } else setRect(null)
    }
    locate()
    const refresh = () => {
      const target = findVisibleTarget(step.selector)
      setRect(target?.getBoundingClientRect() ?? null)
    }
    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, true)
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', refresh); window.removeEventListener('scroll', refresh, true) }
  }, [active, location.pathname, navigate, step])

  useEffect(() => {
    if (wasActive.current && !active) window.requestAnimationFrame(() => document.querySelector('[data-tour="trigger"]')?.focus())
    wasActive.current = active
  }, [active])

  useEffect(() => {
    if (!active) return undefined
    dialogRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { skip(); return }
      if (event.key !== 'Tab') return
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled)')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active, skip, stepIndex])

  if (!active) return null
  const last = stepIndex === total - 1
  const spotlight = rect ? (() => {
    const top = Math.max(8, rect.top - 8)
    const left = Math.max(8, rect.left - 8)
    return {
      top,
      left,
      width: Math.max(0, Math.min(window.innerWidth - left - 8, rect.width + 16)),
      height: Math.max(0, Math.min(window.innerHeight - top - 8, rect.height + 16)),
    }
  })() : null

  return <div className={`tour-layer${spotlight ? ' tour-layer--spotlight' : ''}`} role="presentation">
    {spotlight && <div className="tour-spotlight" style={spotlight} aria-hidden="true" />}
    <section className="tour-dialog" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description" tabIndex="-1" ref={dialogRef}>
      <div className="tour-dialog__progress"><span>Paso {stepIndex + 1} de {total}</span><button type="button" onClick={skip}>Omitir</button></div>
      <h2 id="tour-title">{step.title}</h2>
      <p id="tour-description">{step.description}</p>
      <div className="tour-dialog__actions">
        <button className="button button--secondary" type="button" onClick={previous} disabled={stepIndex === 0}>Anterior</button>
        <button className="button button--primary" type="button" onClick={last ? finish : next}>{last ? 'Finalizar' : 'Siguiente'}</button>
      </div>
    </section>
  </div>
}
