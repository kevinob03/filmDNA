import { useLayoutEffect } from 'react'

export const useScrollReveal = () => {
  useLayoutEffect(() => {
    const sections = [...document.querySelectorAll('.home-section')]
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion || !('IntersectionObserver' in window)) return undefined

    sections.forEach((section) => section.classList.add('scroll-reveal'))

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('scroll-reveal--visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.22, rootMargin: '0px 0px -15% 0px' })

    sections.forEach((section) => observer.observe(section))

    return () => {
      observer.disconnect()
      sections.forEach((section) => section.classList.remove('scroll-reveal', 'scroll-reveal--visible'))
    }
  }, [])
}
