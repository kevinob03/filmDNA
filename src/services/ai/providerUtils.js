export const postJson = async (url, options) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) throw new Error(`request-${response.status}`)
    return response.json()
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('timeout')
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
