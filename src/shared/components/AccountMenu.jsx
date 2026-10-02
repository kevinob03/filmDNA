import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getRoleLabel } from '../auth/roles.js'

const SAFE_AVATAR_IMAGE = /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i

function AccountAvatar({ user, compact = false }) {
  const initial = String(user?.nombre ?? '?').trim().slice(0, 1).toUpperCase() || '?'
  const image = typeof user?.avatarImage === 'string'
    && user.avatarImage.length <= 300_000
    && SAFE_AVATAR_IMAGE.test(user.avatarImage)
    ? user.avatarImage
    : ''

  return (
    <span className={'account-menu__avatar' + (compact ? ' account-menu__avatar--compact' : '')} aria-hidden="true">
      {image ? <img src={image} alt="" /> : initial}
    </span>
  )
}

function AccountMenu({ mobile = false }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return undefined

    const closeOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const closeWithEscape = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeWithEscape)
    menuRef.current?.querySelector('[role="menuitem"]')?.focus()

    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [open])

  const navigateMenu = (event) => {
    const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]')]
    const currentIndex = items.indexOf(document.activeElement)
    let nextIndex = null
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length
    if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = items.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    items[nextIndex]?.focus()
  }

  const signOut = () => {
    setOpen(false)
    logout()
  }

  return (
    <div className={'account-menu' + (mobile ? ' account-menu--mobile' : '')} ref={containerRef}>
      <button
        className={mobile ? 'mobile-nav__item account-menu__trigger account-menu__trigger--mobile' : 'account-menu__trigger'}
        type="button"
        ref={triggerRef}
        aria-label={'Abrir menú de cuenta de ' + user.nombre}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <AccountAvatar user={user} compact={mobile} />
        {mobile ? <span>Cuenta</span> : <span className="account-menu__chevron" aria-hidden="true">⌄</span>}
      </button>

      {open ? (
        <div className="account-menu__panel" id={menuId} role="menu" ref={menuRef} onKeyDown={navigateMenu}>
          <div className="account-menu__identity">
            <AccountAvatar user={user} />
            <div><strong>{user.nombre}</strong><span>{getRoleLabel(user.role)}</span></div>
          </div>
          <NavLink className="account-menu__item" role="menuitem" to="/perfil" onClick={() => setOpen(false)}>
            <span aria-hidden="true">◎</span>
            Perfil
          </NavLink>
          <button className="account-menu__item account-menu__item--logout" role="menuitem" type="button" onClick={signOut}>
            <span aria-hidden="true">↪</span>
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default AccountMenu
