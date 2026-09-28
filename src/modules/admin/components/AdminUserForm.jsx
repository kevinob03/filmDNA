import { useEffect, useState } from 'react'
import { ADMIN_USER_ROLES } from '../../../services/adminUserService.js'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY = { nombre: '', email: '', password: '', role: 'usuario' }
function AdminUserForm({ editingUser, isSaving, onCancel, onSubmit }) {
  const editing = Boolean(editingUser)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  useEffect(() => { setValues(editingUser ? { ...editingUser, password: '' } : EMPTY); setErrors({}) }, [editingUser])
  const change = ({ target: { name, value } }) => { setValues((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: undefined })) }
  const submit = async (event) => { event.preventDefault(); const next = {}; if (!values.nombre.trim()) next.nombre = 'El nombre es obligatorio.'; if (!EMAIL_PATTERN.test(values.email.trim())) next.email = 'Ingresa un correo válido.'; if (!editing && values.password.length < 6) next.password = 'Usa al menos 6 caracteres.'; if (!ADMIN_USER_ROLES.includes(values.role)) next.role = 'Selecciona un rol válido.'; if (Object.keys(next).length) return setErrors(next); const saved = await onSubmit(values); if (saved && !editing) { setValues(EMPTY); setErrors({}) } }
  const field = (name, label, type = 'text') => <div className="form-field"><label htmlFor={`admin-${name}`}>{label}</label><input id={`admin-${name}`} name={name} type={type} value={values[name]} onChange={change} aria-invalid={Boolean(errors[name])} />{errors[name] && <p className="form-field__error">{errors[name]}</p>}</div>
  return <section className="admin-panel" aria-labelledby="admin-form-title"><header className="admin-section-heading"><p className="eyebrow"><span aria-hidden="true" />{editing ? 'Actualizar' : 'Crear'}</p><h2 id="admin-form-title">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h2></header><form className="admin-form" onSubmit={submit} noValidate>{field('nombre', 'Nombre')}{field('email', 'Email', 'email')}{!editing && field('password', 'Contraseña', 'password')}<div className="form-field"><label htmlFor="admin-role">Rol</label><select id="admin-role" name="role" value={values.role} onChange={change}>{ADMIN_USER_ROLES.map((role) => <option key={role} value={role}>{role === 'admin' ? 'Administrador' : 'Usuario'}</option>)}</select></div><div className="admin-actions"><button className="button button--primary" disabled={isSaving}>{isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario'}</button>{editing && <button className="button button--secondary" type="button" onClick={onCancel}>Cancelar</button>}</div></form></section>
}
export default AdminUserForm