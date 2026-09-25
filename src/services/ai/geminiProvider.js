import { movieDNAJsonSchema, parseProviderJson } from './movieDNASchema.js'
import { postJson } from './providerUtils.js'

const { additionalProperties: _additionalProperties, ...geminiResponseSchema } = movieDNAJsonSchema

export const geminiProvider = {
  name: 'gemini',
  getConfig: () => ({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY?.trim(),
    model: import.meta.env.VITE_GEMINI_MODEL?.trim(),
  }),
  async generate(prompt, config) {
    const data = await postJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: geminiResponseSchema } }),
    })
    return parseProviderJson(data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join(''))
  },
}
