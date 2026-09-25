import { Route, Routes } from 'react-router-dom'
import HomePage from '../modules/home/HomePage.jsx'
import NotFoundPage from './NotFoundPage.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
