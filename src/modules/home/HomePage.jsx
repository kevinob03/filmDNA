import Hero from './components/Hero.jsx'
import ExperienceSelector from './components/ExperienceSelector.jsx'
import MovieDNAPreview from './components/MovieDNAPreview.jsx'
import PersonalizationSection from './components/PersonalizationSection.jsx'
import TrendingMovies from './components/TrendingMovies.jsx'
import PlatformOverview from './components/PlatformOverview.jsx'
import './home.css'

function HomePage() {
  return (
    <main id="main-content" className="home-page">
      <Hero />
      <ExperienceSelector />
      <TrendingMovies />
      <PersonalizationSection />
      <MovieDNAPreview />
      <PlatformOverview />
    </main>
  )
}

export default HomePage
