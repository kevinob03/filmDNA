import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getStatisticsErrorMessage, getUserStatisticsActivity } from '../../services/statisticsService.js'
import ContentState from '../../components/shared/ContentState.jsx'
import PageContainer from '../../components/shared/PageContainer.jsx'
import MonthlyActivityChart from '../../components/statistics/MonthlyActivityChart.jsx'
import StatisticsSummary from '../../components/statistics/StatisticsSummary.jsx'
import { summarizeStatistics } from '../../utils/statisticsCalculations.js'
import '../../styles/pages/statistics.css'

const EMPTY_SUMMARY = summarizeStatistics()

function StatisticsSkeleton() {
  return <div className="statistics-skeleton" aria-label="Cargando estadísticas" aria-busy="true"><span /><span /><span /></div>
}

function StatisticsPage() {
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', summary: EMPTY_SUMMARY, error: '' })
  const loadStatistics = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const activity = await getUserStatisticsActivity(user.id)
      setState({ status: 'success', summary: summarizeStatistics(activity), error: '' })
    } catch (error) {
      setState({ status: 'error', summary: EMPTY_SUMMARY, error: getStatisticsErrorMessage(error) })
    }
  }, [user.id])
  useEffect(() => { loadStatistics() }, [loadStatistics])
  const empty = state.status === 'success' && state.summary.watchedCount === 0 && state.summary.favoriteCount === 0 && state.summary.watchlistCount === 0 && state.summary.customListCount === 0
  return (
    <main id="main-content" className="statistics-page"><PageContainer>
      <header className="statistics-page__header"><div><p className="eyebrow"><span aria-hidden="true" />Tu recorrido FilmDNA</p><h1>Mis estadísticas</h1><p>Una mirada clara a la actividad que has registrado en tu Diario y Biblioteca.</p></div><Link className="button button--primary" to="/diario">Abrir Diario</Link></header>
      {state.status === 'loading' ? <StatisticsSkeleton /> : null}
      {state.status === 'error' ? <ContentState title="No pudimos cargar tus estadísticas" message={state.error} actionLabel="Reintentar" onAction={loadStatistics} /> : null}
      {state.status === 'success' ? <div className="statistics-content"><StatisticsSummary summary={state.summary} />{empty ? <ContentState title="Aún no tienes actividad registrada" message="Explora películas y registra una en tu Diario para comenzar a construir tus estadísticas." /> : null}<MonthlyActivityChart series={state.summary.monthlyActivity} /><section className="statistics-secondary" aria-labelledby="library-summary-title"><header className="statistics-section-heading"><p className="eyebrow"><span aria-hidden="true" />Tu Biblioteca</p><h2 id="library-summary-title">Guardado para ti</h2></header><dl><div><dt>Pendientes</dt><dd>{state.summary.watchlistCount}</dd></div><div><dt>Listas personalizadas</dt><dd>{state.summary.customListCount}</dd></div></dl><Link className="text-link" to="/biblioteca">Abrir Biblioteca</Link></section>{empty ? <Link className="button button--secondary statistics-explore" to="/explorar">Explorar películas</Link> : null}</div> : null}
    </PageContainer></main>
  )
}

export default StatisticsPage
