import { movieDNAJsonSchema, parseProviderJson } from './movieDNASchema.js'
import { postJson } from './providerUtils.js'

export const groqProvider = {
  name: 'groq',
  getConfig: () => ({
    apiKey: import.meta.env.VITE_GROQ_API_KEY?.trim(),
    model: import.meta.env.VITE_GROQ_MODEL?.trim(),
  }),
  async generate(prompt, config) {
    const data = await postJson('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_schema', json_schema: { name: 'movie_dna', strict: true, schema: movieDNAJsonSchema } } }),
    })
    return parseProviderJson(data?.choices?.[0]?.message?.content)
  },
}
