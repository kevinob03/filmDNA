import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      let attempts = 0
      let timer
      const revealTarget = () => {
        const target = document.querySelector(hash)
        if (target) target.scrollIntoView({ block: 'start' })
        else if (attempts < 20) {
          attempts += 1
          timer = window.setTimeout(revealTarget, 100)
        }
      }
      window.requestAnimationFrame(revealTarget)
      return () => window.clearTimeout(timer)
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
    return undefined
  }, [pathname, hash])

  return null
}

export default ScrollToTop
