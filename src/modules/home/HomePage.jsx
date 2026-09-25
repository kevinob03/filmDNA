import Hero from './components/Hero.jsx'
import ExperienceSelector from './components/ExperienceSelector.jsx'
import MovieDNAPreview from './components/MovieDNAPreview.jsx'
import HomePlaceholders from './components/HomePlaceholders.jsx'
import PlatformOverview from './components/PlatformOverview.jsx'
import './home.css'

function HomePage() {
  return (
    <main id="main-content" className="home-page">
      <Hero />
      <ExperienceSelector />
      <HomePlaceholders />
      <MovieDNAPreview />
      <PlatformOverview />
    </main>
  )
}

export default HomePage
