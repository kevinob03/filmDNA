import { AI_CLASSIFICATION_THRESHOLDS } from './movieDNARules.js'

export const mergeAIClassification = (deterministic, aiAssessment, tmdbId) => {
  if (!deterministic || deterministic.status !== 'unknown') return deterministic
  if (!aiAssessment) return deterministic

  const trace = {
    status: aiAssessment.status,
    score: aiAssessment.score,
    confidence: aiAssessment.confidence,
    source: 'ai',
    evidence: aiAssessment.evidence,
    provider: aiAssessment.provider,
    model: aiAssessment.model,
  }

  const validKnown = aiAssessment.status === 'known'
    && Number.isFinite(aiAssessment.score)
    && aiAssessment.confidence >= AI_CLASSIFICATION_THRESHOLDS.minimumConfidence

  if (!validKnown) return { ...deterministic, aiAssessment: trace }

  const effectiveConfidence = Math.min(
    AI_CLASSIFICATION_THRESHOLDS.maximumEffectiveConfidence,
    aiAssessment.confidence * AI_CLASSIFICATION_THRESHOLDS.reliabilityMultiplier,
  )

  return {
    ...deterministic,
    status: 'known',
    score: aiAssessment.score,
    confidence: Number(effectiveConfidence.toFixed(2)),
    source: 'ai',
    evidence: aiAssessment.evidence.map((text, index) => ({
      ruleId: `ai:${aiAssessment.dimension}:${aiAssessment.target}:${index}`,
      source: 'ai',
      sourceId: Number(tmdbId),
      sourceValue: text,
      contribution: 1,
      confidence: Number(effectiveConfidence.toFixed(2)),
      provider: aiAssessment.provider,
      model: aiAssessment.model,
    })),
    aiAssessment: trace,
  }
}

export const mergeMovieDNAEvidence = (movieDNA, assessments = []) => {
  if (!assessments.length) return movieDNA
  const experience = Object.fromEntries(Object.entries(movieDNA.experience).map(([group, options]) => [
    group,
    { ...options },
  ]))

  assessments.forEach((assessment) => {
    const deterministic = experience[assessment.dimension]?.[assessment.target]
    if (!deterministic) return
    experience[assessment.dimension][assessment.target] = mergeAIClassification(deterministic, assessment, movieDNA.tmdbId)
  })

  return { ...movieDNA, experience }
}
