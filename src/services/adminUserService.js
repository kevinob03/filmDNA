import { APP_ROLE_VALUES } from '../constants/roles.js'

const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env?.VITE_API_URL?.trim()
const DEFAULT_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')

export const ADMIN_USER_ROLES = APP_ROLE_VALUES
export class AdminUserServiceError extends Error { constructor(type, status) { super(type); this.name = 'AdminUserServiceError'; this.type = type; this.status = status } }
const normalizeEmail = (email) => email.trim().toLowerCase()
const toPublicUser = ({ id, nombre, email, role }) => ({ id, nombre, email, role })

export const createAdminUserService = (baseUrl = DEFAULT_BASE_URL) => {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '')
  const request = async (endpoint, options = {}) => {
    let response
    try { response = await fetch(`${apiBaseUrl}${endpoint}`, { ...options, headers: { Accept: 'application/json', ...options.headers } }) }
    catch { throw new AdminUserServiceError('network') }
    if (!response.ok) throw new AdminUserServiceError(response.status === 404 ? 'not-found' : 'request', response.status)
    if (response.status === 204) return null
    return response.json()
  }
  const findByEmail = async (email) => {
    const normalized = normalizeEmail(email)
    const users = await request(`/usuarios?email=${encodeURIComponent(normalized)}`)
    return users.find((user) => normalizeEmail(user.email) === normalized) ?? null
  }
  return {
    async listUsers() { return (await request('/usuarios')).map(toPublicUser) },
    async createUser({ nombre, email, password, role }) {
      const normalized = normalizeEmail(email)
      if (await findByEmail(normalized)) throw new AdminUserServiceError('duplicate-email')
      return toPublicUser(await request('/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nombre.trim(), email: normalized, password, role }) }))
    },
    async updateUser(id, { nombre, email, role }) {
      const normalized = normalizeEmail(email)
      const duplicate = await findByEmail(normalized)
      if (duplicate && String(duplicate.id) !== String(id)) throw new AdminUserServiceError('duplicate-email')
      return toPublicUser(await request(`/usuarios/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nombre.trim(), email: normalized, role }) }))
    },
    async deleteUser(id) { await request(`/usuarios/${encodeURIComponent(id)}`, { method: 'DELETE' }) },
  }
}
const service = createAdminUserService()
export const listAdminUsers = service.listUsers
export const createAdminUser = service.createUser
export const updateAdminUser = service.updateUser
export const deleteAdminUser = service.deleteUser
export const getAdminUserErrorMessage = (error) => error?.type === 'duplicate-email' ? 'Ya existe una cuenta registrada con ese correo.' : error?.type === 'network' ? 'No pudimos conectar con JSON Server. Comprueba que esté activo.' : error?.type === 'not-found' ? 'El usuario ya no existe.' : 'No pudimos completar la operación. Inténtalo de nuevo.'