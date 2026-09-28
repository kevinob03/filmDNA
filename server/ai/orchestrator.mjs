import { AIProviderError } from './errors.mjs'
import { AI_PROVIDERS } from './providers.mjs'

export const DEFAULT_AI_BUDGET_MS = 6_000
const MINIMUM_PROVIDER_WINDOW_MS = 250

export const getConfiguredProviders = (env = process.env) => AI_PROVIDERS
  .map((provider) => ({ provider, config: provider.getConfig(env) }))
  .filter(({ config }) => config.apiKey && config.model)

export const runAIOperation = async (operation, input, { env = process.env, budgetMs = DEFAULT_AI_BUDGET_MS } = {}) => {
  const normalizedInput = operation.validateInput ? operation.validateInput(input) : input
  const configured = getConfiguredProviders(env)
  if (!configured.length) throw new AIProviderError('configuration')

  const safeBudget = Math.min(10_000, Math.max(1_000, Number(budgetMs) || DEFAULT_AI_BUDGET_MS))
  const deadline = Date.now() + safeBudget
  let lastError = null

  for (const { provider, config } of configured) {
    const remainingMs = deadline - Date.now()
    if (remainingMs < MINIMUM_PROVIDER_WINDOW_MS) break
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), remainingMs)
    try {
      const result = await provider.generate({
        operationName: operation.name,
        prompt: operation.buildPrompt(normalizedInput),
        schema: operation.schema,
        signal: controller.signal,
      }, config)
      return {
        result: operation.validate(result, normalizedInput),
        provider: provider.name,
        model: config.model,
      }
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  if (Date.now() >= deadline) throw new AIProviderError('timeout', { cause: lastError })
  throw lastError instanceof AIProviderError ? lastError : new AIProviderError('unavailable', { cause: lastError })
}
