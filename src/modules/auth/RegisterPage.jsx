import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getAuthErrorMessage } from '../../services/authService.js'
import AuthPageShell from './components/AuthPageShell.jsx'

const MIN_PASSWORD_LENGTH = 6
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateRegistration = ({ nombre, email, password, confirmPassword }) => {
  const errors = {}

  if (!nombre.trim()) errors.nombre = 'Ingresa tu nombre.'
  if (!email.trim()) errors.email = 'Ingresa tu correo.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Ingresa un correo válido.'
  if (!password) errors.password = 'Crea una contraseña.'
  else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (!confirmPassword) errors.confirmPassword = 'Confirma tu contraseña.'
  else if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.'

  return errors
}

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
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
    const validationErrors = validateRegistration(values)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      await register({
        nombre: values.nombre,
        email: values.email,
        password: values.password,
      })
      navigate('/perfil', { replace: true })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageShell
      eyebrow="Nueva cuenta"
      title="Crea tu perfil"
      description="Regístrate para acceder a tu espacio personal. El descubrimiento de películas seguirá siendo público."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__heading">
          <h2>Datos de acceso</h2>
          <p>Todos los campos son obligatorios.</p>
        </div>

        {formError && <p className="form-message form-message--error" role="alert">{formError}</p>}

        <div className="form-field">
          <label htmlFor="register-name">Nombre</label>
          <input
            id="register-name"
            name="nombre"
            type="text"
            autoComplete="name"
            value={values.nombre}
            onChange={handleChange}
            aria-invalid={Boolean(errors.nombre)}
            aria-describedby={errors.nombre ? 'register-name-error' : undefined}
          />
          {errors.nombre && <p id="register-name-error" className="form-field__error">{errors.nombre}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
          />
          {errors.email && <p id="register-email-error" className="form-field__error">{errors.email}</p>}
        </div>

        <div className="auth-form__passwords">
          <div className="form-field">
            <label htmlFor="register-password">Contraseña</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'register-password-error' : 'register-password-hint'}
            />
            {errors.password
              ? <p id="register-password-error" className="form-field__error">{errors.password}</p>
              : <p id="register-password-hint" className="form-field__hint">Mínimo 6 caracteres.</p>}
          </div>

          <div className="form-field">
            <label htmlFor="register-confirm-password">Confirmar contraseña</label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            />
            {errors.confirmPassword && (
              <p id="register-confirm-password-error" className="form-field__error">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button className="button button--primary auth-form__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="auth-form__alternate">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </form>
    </AuthPageShell>
  )
}

export default RegisterPage
