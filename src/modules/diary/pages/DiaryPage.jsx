import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { getDiaryErrorMessage, listUserDiaryEntries } from '../../../services/diaryService.js'
import { hydrateDiaryEntries } from '../../../services/diaryMovieService.js'
import ContentState from '../../../shared/components/ContentState.jsx'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import DiaryEntryCard from '../components/DiaryEntryCard.jsx'
import '../diary.css'

function DiarySkeleton() {
  return <div className="diary-skeleton" aria-busy="true" aria-label="Cargando Diario"><span /><span /></div>
}

function DiaryPage() {
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', entries: [], error: '' })
  const loadDiary = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const entries = await listUserDiaryEntries(user.id)
      setState({ status: 'success', entries: await hydrateDiaryEntries(entries), error: '' })
    } catch (error) {
      setState({ status: 'error', entries: [], error: getDiaryErrorMessage(error) })
    }
  }, [user.id])
  useEffect(() => { loadDiary() }, [loadDiary])
  return (
    <main id="main-content" className="diary-page"><PageContainer>
      <header className="diary-page__header"><div><p className="eyebrow"><span aria-hidden="true" />Tu historia en pantalla</p><h1>Mi Diario</h1><p>Consulta las películas que viste y las impresiones que guardaste de cada una.</p></div><Link className="button button--primary" to="/explorar">Explorar películas</Link></header>
      {state.status === 'loading' ? <DiarySkeleton /> : null}
      {state.status === 'error' ? <ContentState title="No pudimos cargar tu Diario" message={state.error} actionLabel="Reintentar" onAction={loadDiary} /> : null}
      {state.status === 'success' && state.entries.length === 0 ? <ContentState title="Tu Diario está vacío" message="Todavía no registraste ninguna película vista. Abre una película para guardar tu primera experiencia." /> : null}
      {state.status === 'success' && state.entries.length > 0 ? <section className="diary-entries" aria-label="Registros del Diario">{state.entries.map((item) => <DiaryEntryCard key={item.entry.id} item={item} />)}</section> : null}
    </PageContainer></main>
  )
}

export default DiaryPage
