import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getAuthErrorMessage } from '../../services/authService.js'
import AuthPageShell from './components/AuthPageShell.jsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateLogin = ({ email, password }) => {
  const errors = {}

  if (!email.trim()) errors.email = 'Ingresa tu correo.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Ingresa un correo válido.'
  if (!password) errors.password = 'Ingresa tu contraseña.'

  return errors
}

const getReturnPath = (location) => {
  if (!location?.pathname?.startsWith('/')) return '/perfil'
  return `${location.pathname}${location.search ?? ''}${location.hash ?? ''}`
}

function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = ({ target: { name, value } }) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateLogin(values)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      await login(values)
      navigate(getReturnPath(location.state?.from), { replace: true })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageShell
      eyebrow="Acceso personal"
      title="Inicia sesión"
      description="Recupera tu espacio personal sin interrumpir la exploración pública del catálogo."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__heading">
          <h2>Tu cuenta</h2>
          <p>Usa las credenciales registradas en el servicio local.</p>
        </div>

        {formError && <p className="form-message form-message--error" role="alert">{formError}</p>}

        <div className="form-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {errors.email && <p id="login-email-error" className="form-field__error">{errors.email}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
          />
          {errors.password && <p id="login-password-error" className="form-field__error">{errors.password}</p>}
        </div>

        <button className="button button--primary auth-form__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>

        <p className="auth-form__alternate">
          ¿Aún no tienes cuenta? <Link to="/registro">Registrarse</Link>
        </p>
      </form>
    </AuthPageShell>
  )
}

export default LoginPage
