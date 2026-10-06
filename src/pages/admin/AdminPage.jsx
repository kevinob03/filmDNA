import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import PageContainer from '../../components/shared/PageContainer.jsx'
import { createAdminUser, deleteAdminUser, getAdminUserErrorMessage, listAdminUsers, updateAdminUser } from '../../services/adminUserService.js'
import { getAdminAnalyticsData, getAdminAnalyticsErrorMessage } from '../../services/adminAnalyticsService.js'
import { requestAdminProjection } from '../../services/aiClient.js'
import { buildAdminAnalytics, buildAdminProjectionInput } from '../../utils/adminAnalytics.js'
import { AdminMetrics, RoleDistributionChart } from '../../components/admin/AdminDashboard.jsx'
import {
  ActivityProjectionChart,
  AIProjectionPanel,
  EngagementMetrics,
  FeatureAdoptionChart,
  RatingDistributionChart,
} from '../../components/admin/AdminAnalyticsCharts.jsx'
import AdminUserForm from '../../components/admin/AdminUserForm.jsx'
import AdminUserList from '../../components/admin/AdminUserList.jsx'
import DeleteUserDialog from '../../components/admin/DeleteUserDialog.jsx'
import '../../styles/pages/admin.css'

const getProjectionErrorMessage = (error) => {
  if (error?.type === 'configuration') return 'No hay un proveedor de IA configurado en el servidor. Configura Gemini, Groq o DeepSeek y vuelve a intentarlo.'
  if (error?.type === 'rate-limited') return 'El proveedor de IA alcanzó temporalmente su límite. La línea base matemática continúa disponible.'
  if (error?.type === 'timeout') return 'La proyección de IA tardó demasiado. Puedes reintentar; los gráficos reales no se ven afectados.'
  return 'No pudimos generar la proyección con IA. La línea base matemática continúa disponible.'
}

function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [projectionStatus, setProjectionStatus] = useState('idle')
  const [projectionResult, setProjectionResult] = useState(null)
  const [projectionError, setProjectionError] = useState('')

  const loadDashboard = async () => {
    setStatus('loading')
    setMessage(null)
    try {
      const [loadedUsers, loadedAnalytics] = await Promise.all([listAdminUsers(), getAdminAnalyticsData()])
      setUsers(loadedUsers)
      setAnalyticsData(loadedAnalytics)
      setStatus('success')
    } catch (error) {
      const text = error?.name === 'AdminAnalyticsServiceError' ? getAdminAnalyticsErrorMessage(error) : getAdminUserErrorMessage(error)
      setMessage({ type: 'error', text })
      setStatus('error')
    }
  }

  useEffect(() => { loadDashboard() }, [])

  const metrics = useMemo(() => users.reduce((result, item) => {
    result.total += 1
    if (item.role === 'admin') result.admins += 1
    else if (item.role === 'psychologist') result.psychologists += 1
    else if (item.role === 'usuario') result.users += 1
    return result
  }, { total: 0, users: 0, psychologists: 0, admins: 0 }), [users])
  const analytics = useMemo(() => analyticsData ? buildAdminAnalytics(analyticsData) : null, [analyticsData])

  const refreshAnalytics = async () => {
    try { setAnalyticsData(await getAdminAnalyticsData()) } catch { /* El CRUD ya informa su propio resultado. */ }
  }

  const saveUser = async (values) => {
    setBusy(true)
    setMessage(null)
    try {
      if (editingUser) {
        const updated = await updateAdminUser(editingUser.id, values)
        setUsers((current) => current.map((item) => String(item.id) === String(updated.id) ? updated : item))
        setEditingUser(null)
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente.' })
      } else {
        const created = await createAdminUser(values)
        setUsers((current) => [...current, created])
        setMessage({ type: 'success', text: 'Usuario creado correctamente.' })
      }
      await refreshAnalytics()
      setProjectionResult(null)
      return true
    } catch (error) {
      setMessage({ type: 'error', text: getAdminUserErrorMessage(error) })
      return false
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingUser || String(deletingUser.id) === String(user.id)) return
    setBusy(true)
    setMessage(null)
    try {
      await deleteAdminUser(deletingUser.id)
      setUsers((current) => current.filter((item) => String(item.id) !== String(deletingUser.id)))
      setDeletingUser(null)
      setMessage({ type: 'success', text: 'Usuario eliminado correctamente.' })
      await refreshAnalytics()
      setProjectionResult(null)
    } catch (error) {
      setMessage({ type: 'error', text: getAdminUserErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  const generateProjection = async () => {
    if (!analytics) return
    setProjectionStatus('loading')
    setProjectionError('')
    try {
      setProjectionResult(await requestAdminProjection(buildAdminProjectionInput(analytics)))
      setProjectionStatus('success')
    } catch (error) {
      setProjectionError(getProjectionErrorMessage(error))
      setProjectionStatus('error')
    }
  }

  return (
    <main id="main-content" className="admin-page">
      <PageContainer>
        <header className="admin-page__header">
          <p className="eyebrow"><span aria-hidden="true" />Control y analítica</p>
          <h1>Administración</h1>
          <p>Supervisa cuentas, adopción y actividad real de FilmDNA. Las proyecciones se presentan como estimaciones, no como certezas.</p>
        </header>
        {message && <p className={`admin-message admin-message--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}
        {status === 'loading' && <div className="admin-state" aria-live="polite"><h2>Cargando dashboard…</h2><p>Consultando cuentas y actividad agregada.</p></div>}
        {status === 'error' && <div className="admin-state"><h2>No pudimos cargar el panel</h2><button className="button button--primary" onClick={loadDashboard}>Reintentar</button></div>}
        {status === 'success' && analytics && <>
          <div className="admin-dashboard admin-dashboard--overview">
            <AdminMetrics {...metrics} />
            <RoleDistributionChart {...metrics} />
          </div>
          <div className="admin-analytics-grid">
            <EngagementMetrics totals={analytics.totals} />
            <ActivityProjectionChart analytics={analytics} aiProjection={projectionResult?.result} />
            <FeatureAdoptionChart adoption={analytics.adoption} totalUsers={analytics.totals.users} />
            <RatingDistributionChart distribution={analytics.ratingDistribution} />
            <AIProjectionPanel result={projectionResult} status={projectionStatus} error={projectionError} onGenerate={generateProjection} baselineForecast={analytics.baselineForecast} />
          </div>
          <div className="admin-management">
            <AdminUserForm editingUser={editingUser} isSaving={busy} onCancel={() => setEditingUser(null)} onSubmit={saveUser} />
            <section className="admin-panel" aria-labelledby="users-title">
              <header className="admin-section-heading"><p className="eyebrow"><span aria-hidden="true" />CRUD de usuarios</p><h2 id="users-title">Cuentas registradas</h2></header>
              <AdminUserList currentUserId={user.id} users={users} onEdit={setEditingUser} onDelete={setDeletingUser} />
            </section>
          </div>
        </>}
        {deletingUser && <DeleteUserDialog busy={busy} user={deletingUser} onCancel={() => setDeletingUser(null)} onConfirm={confirmDelete} />}
      </PageContainer>
    </main>
  )
}

export default AdminPage
