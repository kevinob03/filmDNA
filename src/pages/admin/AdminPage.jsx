import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import PageContainer from '../../components/shared/PageContainer.jsx'
import { createAdminUser, deleteAdminUser, getAdminUserErrorMessage, listAdminUsers, updateAdminUser } from '../../services/adminUserService.js'
import { AdminMetrics, RoleDistributionChart } from '../../components/admin/AdminDashboard.jsx'
import AdminUserForm from '../../components/admin/AdminUserForm.jsx'
import AdminUserList from '../../components/admin/AdminUserList.jsx'
import DeleteUserDialog from '../../components/admin/DeleteUserDialog.jsx'
import '../../styles/pages/admin.css'

function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [busy, setBusy] = useState(false)

  const loadUsers = async () => {
    setStatus('loading'); setMessage(null)
    try { setUsers(await listAdminUsers()); setStatus('success') }
    catch (error) { setMessage({ type: 'error', text: getAdminUserErrorMessage(error) }); setStatus('error') }
  }
  useEffect(() => { loadUsers() }, [])

  const metrics = useMemo(() => users.reduce((result, item) => { result.total += 1; if (item.role === 'admin') result.admins += 1; else if (item.role === 'psychologist') result.psychologists += 1; else if (item.role === 'usuario') result.users += 1; return result }, { total: 0, users: 0, psychologists: 0, admins: 0 }), [users])

  const saveUser = async (values) => {
    setBusy(true); setMessage(null)
    try {
      if (editingUser) {
        const updated = await updateAdminUser(editingUser.id, values)
        setUsers((current) => current.map((item) => String(item.id) === String(updated.id) ? updated : item))
        setEditingUser(null); setMessage({ type: 'success', text: 'Usuario actualizado correctamente.' }); return true
      } else {
        const created = await createAdminUser(values)
        setUsers((current) => [...current, created]); setMessage({ type: 'success', text: 'Usuario creado correctamente.' }); return true
      }
    } catch (error) { setMessage({ type: 'error', text: getAdminUserErrorMessage(error) }); return false }
    finally { setBusy(false) }
  }

  const confirmDelete = async () => {
    if (!deletingUser || String(deletingUser.id) === String(user.id)) return
    setBusy(true); setMessage(null)
    try { await deleteAdminUser(deletingUser.id); setUsers((current) => current.filter((item) => String(item.id) !== String(deletingUser.id))); setDeletingUser(null); setMessage({ type: 'success', text: 'Usuario eliminado correctamente.' }) }
    catch (error) { setMessage({ type: 'error', text: getAdminUserErrorMessage(error) }) }
    finally { setBusy(false) }
  }

  return <main id="main-content" className="admin-page"><PageContainer><header className="admin-page__header"><p className="eyebrow"><span aria-hidden="true" />Control de acceso</p><h1>Administración</h1><p>Gestiona las cuentas de FilmDNA con información persistida en JSON Server.</p></header>{message && <p className={`admin-message admin-message--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}{status === 'loading' && <div className="admin-state" aria-live="polite"><h2>Cargando usuarios…</h2><p>Consultando el servicio local.</p></div>}{status === 'error' && <div className="admin-state"><h2>No pudimos cargar el panel</h2><button className="button button--primary" onClick={loadUsers}>Reintentar</button></div>}{status === 'success' && <><div className="admin-dashboard"><AdminMetrics {...metrics} /><RoleDistributionChart {...metrics} /></div><div className="admin-management"><AdminUserForm editingUser={editingUser} isSaving={busy} onCancel={() => setEditingUser(null)} onSubmit={saveUser} /><section className="admin-panel" aria-labelledby="users-title"><header className="admin-section-heading"><p className="eyebrow"><span aria-hidden="true" />CRUD de usuarios</p><h2 id="users-title">Cuentas registradas</h2></header><AdminUserList currentUserId={user.id} users={users} onEdit={setEditingUser} onDelete={setDeletingUser} /></section></div></>}{deletingUser && <DeleteUserDialog busy={busy} user={deletingUser} onCancel={() => setDeletingUser(null)} onConfirm={confirmDelete} />}</PageContainer></main>
}
export default AdminPage