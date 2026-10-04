import Hero from '../components/Hero.jsx'
import ExperienceSelector from '../components/ExperienceSelector.jsx'
import MovieDNAPreview from '../components/MovieDNAPreview.jsx'
import TrendingMovies from '../components/TrendingMovies.jsx'
import PlatformOverview from '../components/PlatformOverview.jsx'
import HomeFaq from '../components/HomeFaq.jsx'
import ProfessionalSupport from '../components/ProfessionalSupport.jsx'
import { useScrollReveal } from '../useScrollReveal.js'
import '../home.css'

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
