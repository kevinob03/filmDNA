import Hero from '../../components/home/Hero.jsx'
import ExperienceSelector from '../../components/home/ExperienceSelector.jsx'
import MovieDNAPreview from '../../components/home/MovieDNAPreview.jsx'
import TrendingMovies from '../../components/home/TrendingMovies.jsx'
import PlatformOverview from '../../components/home/PlatformOverview.jsx'
import HomeFaq from '../../components/home/HomeFaq.jsx'
import ProfessionalSupport from '../../components/home/ProfessionalSupport.jsx'
import { useScrollReveal } from '../../hooks/useScrollReveal.js'
import '../../styles/pages/home.css'

function HomePage() {
  useScrollReveal()

  return (
    <main id="main-content" className="home-page">
      <Hero />
      <ExperienceSelector />
      <TrendingMovies />
      <MovieDNAPreview />
      <PlatformOverview />
      <ProfessionalSupport />
      <HomeFaq />
    </main>
  )
}

export default HomePage
