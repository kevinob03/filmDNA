function TmdbAttribution() {
  return (
    <footer className="tmdb-credits">
      <div className="page-container tmdb-credits__inner">
        <a href="https://www.themoviedb.org" aria-label="Visitar The Movie Database">
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
            alt="TMDB"
            loading="lazy"
          />
        </a>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
    </footer>
  )
}

export default TmdbAttribution
