const DEFAULT_API_URL = 'http://localhost:3001'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const API_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')

export class AuthServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'AuthServiceError'
    this.type = type
    this.status = status
  }
}

const normalizeEmail = (email) => email.trim().toLowerCase()

const toSessionUser = ({ id, nombre, email, role }) => ({
  id,
  nombre,
  email,
  role,
})

const request = async (endpoint, options = {}) => {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new AuthServiceError('network')
  }

  if (!response.ok) {
    throw new AuthServiceError(response.status === 404 ? 'not-found' : 'request', response.status)
  }

  if (response.status === 204) return null
  return response.json()
}

export const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email)
  const users = await request(`/usuarios?email=${encodeURIComponent(normalizedEmail)}`)

  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) ?? null
}

export const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email)

  if (!user || user.password !== password) {
    throw new AuthServiceError('invalid-credentials')
  }

  return toSessionUser(user)
}

export const registerUser = async ({ nombre, email, password }) => {
  const normalizedEmail = normalizeEmail(email)
  const existingUser = await findUserByEmail(normalizedEmail)

  if (existingUser) {
    throw new AuthServiceError('duplicate-email')
  }

  const user = await request('/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: nombre.trim(),
      email: normalizedEmail,
      password,
      role: 'usuario',
    }),
  })

  return toSessionUser(user)
}

export const getUserById = async (userId) => {
  const user = await request(`/usuarios/${encodeURIComponent(userId)}`)
  return toSessionUser(user)
}

export const getAuthErrorMessage = (error) => {
  if (error?.type === 'invalid-credentials') {
    return 'Correo o contraseña incorrectos.'
  }

  if (error?.type === 'duplicate-email') {
    return 'Ya existe una cuenta registrada con ese correo.'
  }

  if (error?.type === 'network') {
    return 'No pudimos conectar con el servicio local de FilmDNA. Comprueba que JSON Server esté activo.'
  }

  return 'No pudimos completar la solicitud. Inténtalo de nuevo.'
}
