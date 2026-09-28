import { parseProviderJson, postJson } from './providerUtils.mjs'

export const geminiProvider = {
  name: 'gemini',
  getConfig: (env) => ({ apiKey: env.GEMINI_API_KEY?.trim(), model: env.GEMINI_MODEL?.trim() }),
  async generate({ prompt, schema, signal }, config) {
    const { additionalProperties: _additionalProperties, ...responseSchema } = schema
    const data = await postJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', responseSchema } }),
    }, 'gemini')
    return parseProviderJson(data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join(''), 'gemini')
  },
}

export const deepseekProvider = {
  name: 'deepseek',
  getConfig: (env) => ({ apiKey: env.DEEPSEEK_API_KEY?.trim(), model: env.DEEPSEEK_MODEL?.trim() }),
  async generate({ prompt, signal }, config) {
    const data = await postJson('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, stream: false }),
    }, 'deepseek')
    return parseProviderJson(data?.choices?.[0]?.message?.content, 'deepseek')
  },
}

export const groqProvider = {
  name: 'groq',
  getConfig: (env) => ({ apiKey: env.GROQ_API_KEY?.trim(), model: env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b' }),
  async generate({ operationName, prompt, schema, signal }, config) {
    const data = await postJson('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_schema', json_schema: { name: operationName.replaceAll('-', '_'), strict: true, schema } } }),
    }, 'groq')
    return parseProviderJson(data?.choices?.[0]?.message?.content, 'groq')
  },
}

export const AI_PROVIDERS = Object.freeze([geminiProvider, deepseekProvider, groqProvider])
