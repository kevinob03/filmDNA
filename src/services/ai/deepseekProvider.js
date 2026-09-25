import { parseProviderJson } from './movieDNASchema.js'
import { postJson } from './providerUtils.js'

export const deepseekProvider = {
  name: 'deepseek',
  getConfig: () => ({
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY?.trim(),
    model: import.meta.env.VITE_DEEPSEEK_MODEL?.trim(),
  }),
  async generate(prompt, config) {
    const data = await postJson('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, stream: false }),
    })
    return parseProviderJson(data?.choices?.[0]?.message?.content)
  },
}
