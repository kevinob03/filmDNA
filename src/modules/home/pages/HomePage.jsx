import Hero from '../components/Hero.jsx'
import ExperienceSelector from '../components/ExperienceSelector.jsx'
import MovieDNAPreview from '../components/MovieDNAPreview.jsx'
import PersonalizationSection from '../components/PersonalizationSection.jsx'
import TrendingMovies from '../components/TrendingMovies.jsx'
import PlatformOverview from '../components/PlatformOverview.jsx'
import HomeFaq from '../components/HomeFaq.jsx'
import { useScrollReveal } from '../useScrollReveal.js'
import '../home.css'

function HomePage() {
  useScrollReveal()

  return (
    <main id="main-content" className="home-page">
      <Hero />
      <ExperienceSelector />
      <TrendingMovies />
      <PersonalizationSection />
      <MovieDNAPreview />
      <PlatformOverview />
      <HomeFaq />
    </main>
  )
}

export default HomePage
