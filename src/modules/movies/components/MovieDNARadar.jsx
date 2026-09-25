import {
  interpretMovieDNAValue,
  MOVIE_DNA_DIMENSIONS,
} from '../../../services/movieDNAService.js'

const CENTER = 180
const RADIUS = 108
const LABEL_RADIUS = 148

const pointAt = (index, radius) => {
  const angle = (-90 + index * 60) * Math.PI / 180
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  }
}

const profilePoints = (profile) => MOVIE_DNA_DIMENSIONS
  .map(({ key }, index) => {
    const point = pointAt(index, RADIUS * profile[key] / 100)
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`
  })
  .join(' ')

const gridPoints = (scale) => MOVIE_DNA_DIMENSIONS
  .map((_, index) => {
    const point = pointAt(index, RADIUS * scale)
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`
  })
  .join(' ')

function MovieDNARadar({ profile }) {
  const summary = MOVIE_DNA_DIMENSIONS
    .map(({ key, label }) => `${label}: ${profile[key]} de 100`)
    .join('. ')

  return (
    <div className="movie-dna-visualization">
      <div className="movie-dna-radar">
        <svg viewBox="0 0 360 360" role="img" aria-labelledby="movie-dna-radar-title movie-dna-radar-description">
          <title id="movie-dna-radar-title">Gráfico de radar Movie DNA</title>
          <desc id="movie-dna-radar-description">{summary}</desc>
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <polygon key={scale} className="movie-dna-radar__grid" points={gridPoints(scale)} />
          ))}
          {MOVIE_DNA_DIMENSIONS.map((dimension, index) => {
            const endpoint = pointAt(index, RADIUS)
            const labelPoint = pointAt(index, LABEL_RADIUS)
            return (
              <g key={dimension.key}>
                <line className="movie-dna-radar__axis" x1={CENTER} y1={CENTER} x2={endpoint.x} y2={endpoint.y} />
                <text
                  className="movie-dna-radar__label"
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor={labelPoint.x < 165 ? 'end' : labelPoint.x > 195 ? 'start' : 'middle'}
                  dominantBaseline="middle"
                >
                  {dimension.label}
                </text>
              </g>
            )
          })}
          <polygon className="movie-dna-radar__profile" points={profilePoints(profile)} />
          {MOVIE_DNA_DIMENSIONS.map(({ key }, index) => {
            const point = pointAt(index, RADIUS * profile[key] / 100)
            return <circle key={key} className="movie-dna-radar__point" cx={point.x} cy={point.y} r="4" />
          })}
        </svg>
      </div>

      <dl className="movie-dna-metrics">
        {MOVIE_DNA_DIMENSIONS.map(({ key, label }) => (
          <div className="movie-dna-metric" key={key}>
            <dt>{label}</dt>
            <dd>
              <strong>{profile[key]}</strong>
              <span>{interpretMovieDNAValue(profile[key])}</span>
            </dd>
            <div className="movie-dna-meter" aria-hidden="true">
              <span style={{ width: `${profile[key]}%` }} />
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default MovieDNARadar
