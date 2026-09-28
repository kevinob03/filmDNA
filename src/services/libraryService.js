const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env?.VITE_API_URL?.trim()
const DEFAULT_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
const LIST_TYPES = Object.freeze({ CUSTOM: 'personalizada', WATCHLIST: 'pendientes' })

export class LibraryServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'LibraryServiceError'
    this.type = type
    this.status = status
  }
}

const normalizeId = (value) => String(value)
const normalizeTmdbId = (value) => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new LibraryServiceError('invalid-movie')
  return id
}
const normalizeName = (value) => value.trim().replace(/\s+/g, ' ')
const query = (params) => new URLSearchParams(params).toString()

export const createLibraryService = (baseUrl = DEFAULT_BASE_URL) => {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '')
  const pendingOperations = new Map()

  const request = async (endpoint, options = {}) => {
    let response
    try {
      response = await fetch(`${apiBaseUrl}${endpoint}`, {
        ...options,
        headers: { Accept: 'application/json', ...options.headers },
      })
    } catch {
      throw new LibraryServiceError('network')
    }
    if (!response.ok) throw new LibraryServiceError(response.status === 404 ? 'not-found' : 'request', response.status)
    if (response.status === 204) return null
    return response.json()
  }

  const mutate = (key, operation) => {
    if (pendingOperations.has(key)) return pendingOperations.get(key)
    const promise = operation().finally(() => pendingOperations.delete(key))
    pendingOperations.set(key, promise)
    return promise
  }

  const listUserFavorites = (userId) => request(`/favoritos?${query({ usuarioId: normalizeId(userId) })}`)
  const listUserLists = (userId) => request(`/listas?${query({ usuarioId: normalizeId(userId) })}`)
  const getOwnedList = async (userId, listId) => {
    const lists = await request(`/listas?${query({ id: normalizeId(listId), usuarioId: normalizeId(userId) })}`)
    const list = lists[0]
    if (!list) throw new LibraryServiceError('forbidden')
    return list
  }
  const listRelations = (listId) => request(`/listaPeliculas?${query({ listaId: normalizeId(listId) })}`)

  const ensureWatchlist = (userId) => mutate(`watchlist:${userId}`, async () => {
    const lists = await listUserLists(userId)
    const existing = lists.find((list) => list.tipo === LIST_TYPES.WATCHLIST)
    if (existing) return existing
    return request('/listas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: normalizeId(userId), nombre: 'Ver después', tipo: LIST_TYPES.WATCHLIST }),
    })
  })

  return {
    async getMovieActions(userId, tmdbId) {
      const movieId = normalizeTmdbId(tmdbId)
      const [favorites, lists] = await Promise.all([listUserFavorites(userId), listUserLists(userId)])
      const watchlist = lists.find((list) => list.tipo === LIST_TYPES.WATCHLIST)
      const watchlistRelations = watchlist ? await listRelations(watchlist.id) : []
      return {
        favorite: favorites.some((item) => Number(item.tmdbId) === movieId),
        watchlist: watchlistRelations.some((item) => Number(item.tmdbId) === movieId),
        customLists: lists.filter((list) => list.tipo !== LIST_TYPES.WATCHLIST),
      }
    },

    listFavorites: listUserFavorites,

    addFavorite(userId, tmdbId) {
      const movieId = normalizeTmdbId(tmdbId)
      return mutate(`favorite:add:${userId}:${movieId}`, async () => {
        const favorites = await request(`/favoritos?${query({ usuarioId: normalizeId(userId), tmdbId: movieId })}`)
        if (favorites.length) return favorites[0]
        return request('/favoritos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId: normalizeId(userId), tmdbId: movieId }),
        })
      })
    },

    removeFavorite(userId, tmdbId) {
      const movieId = normalizeTmdbId(tmdbId)
      return mutate(`favorite:remove:${userId}:${movieId}`, async () => {
        const favorites = await request(`/favoritos?${query({ usuarioId: normalizeId(userId), tmdbId: movieId })}`)
        await Promise.all(favorites.map((item) => request(`/favoritos/${encodeURIComponent(item.id)}`, { method: 'DELETE' })))
      })
    },

    async listWatchlist(userId) {
      const lists = await listUserLists(userId)
      const watchlist = lists.find((list) => list.tipo === LIST_TYPES.WATCHLIST)
      return watchlist ? listRelations(watchlist.id) : []
    },

    addToWatchlist(userId, tmdbId) {
      const movieId = normalizeTmdbId(tmdbId)
      return mutate(`watchlist:add:${userId}:${movieId}`, async () => {
        const watchlist = await ensureWatchlist(userId)
        const relations = await request(`/listaPeliculas?${query({ listaId: normalizeId(watchlist.id), tmdbId: movieId })}`)
        if (relations.length) return relations[0]
        return request('/listaPeliculas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listaId: normalizeId(watchlist.id), tmdbId: movieId }),
        })
      })
    },

    removeFromWatchlist(userId, tmdbId) {
      const movieId = normalizeTmdbId(tmdbId)
      return mutate(`watchlist:remove:${userId}:${movieId}`, async () => {
        const lists = await listUserLists(userId)
        const watchlist = lists.find((list) => list.tipo === LIST_TYPES.WATCHLIST)
        if (!watchlist) return
        const relations = await request(`/listaPeliculas?${query({ listaId: normalizeId(watchlist.id), tmdbId: movieId })}`)
        await Promise.all(relations.map((item) => request(`/listaPeliculas/${encodeURIComponent(item.id)}`, { method: 'DELETE' })))
      })
    },

    async listCustomLists(userId) {
      const lists = await listUserLists(userId)
      return lists.filter((list) => list.tipo !== LIST_TYPES.WATCHLIST)
    },

    createCustomList(userId, name) {
      const normalized = normalizeName(name)
      if (!normalized) return Promise.reject(new LibraryServiceError('invalid-name'))
      return mutate(`list:create:${userId}:${normalized.toLowerCase()}`, async () => {
        const lists = await listUserLists(userId)
        const duplicate = lists.some((list) => list.tipo !== LIST_TYPES.WATCHLIST && normalizeName(list.nombre).toLowerCase() === normalized.toLowerCase())
        if (duplicate) throw new LibraryServiceError('duplicate-list')
        return request('/listas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId: normalizeId(userId), nombre: normalized, tipo: LIST_TYPES.CUSTOM }),
        })
      })
    },

    async renameCustomList(userId, listId, name) {
      const normalized = normalizeName(name)
      if (!normalized) throw new LibraryServiceError('invalid-name')
      const list = await getOwnedList(userId, listId)
      if (list.tipo === LIST_TYPES.WATCHLIST) throw new LibraryServiceError('forbidden')
      const lists = await listUserLists(userId)
      const duplicate = lists.some((item) => String(item.id) !== String(listId) && item.tipo !== LIST_TYPES.WATCHLIST && normalizeName(item.nombre).toLowerCase() === normalized.toLowerCase())
      if (duplicate) throw new LibraryServiceError('duplicate-list')
      return mutate(`list:rename:${listId}`, () => request(`/listas/${encodeURIComponent(listId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: normalized }),
      }))
    },

    async deleteCustomList(userId, listId) {
      const list = await getOwnedList(userId, listId)
      if (list.tipo === LIST_TYPES.WATCHLIST) throw new LibraryServiceError('forbidden')
      return mutate(`list:delete:${listId}`, async () => {
        const relations = await listRelations(listId)
        await Promise.all(relations.map((item) => request(`/listaPeliculas/${encodeURIComponent(item.id)}`, { method: 'DELETE' })))
        await request(`/listas/${encodeURIComponent(listId)}`, { method: 'DELETE' })
      })
    },

    async listMoviesInCustomList(userId, listId) {
      const list = await getOwnedList(userId, listId)
      if (list.tipo === LIST_TYPES.WATCHLIST) throw new LibraryServiceError('forbidden')
      return { list, relations: await listRelations(listId) }
    },

    async addMovieToCustomList(userId, listId, tmdbId) {
      const movieId = normalizeTmdbId(tmdbId)
      const list = await getOwnedList(userId, listId)
      if (list.tipo === LIST_TYPES.WATCHLIST) throw new LibraryServiceError('forbidden')
      return mutate(`relation:add:${listId}:${movieId}`, async () => {
        const relations = await request(`/listaPeliculas?${query({ listaId: normalizeId(listId), tmdbId: movieId })}`)
        if (relations.length) return relations[0]
        return request('/listaPeliculas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listaId: normalizeId(listId), tmdbId: movieId }),
        })
      })
    },

    async removeMovieFromCustomList(userId, listId, tmdbId) {
      const movieId = normalizeTmdbId(tmdbId)
      const list = await getOwnedList(userId, listId)
      if (list.tipo === LIST_TYPES.WATCHLIST) throw new LibraryServiceError('forbidden')
      return mutate(`relation:remove:${listId}:${movieId}`, async () => {
        const relations = await request(`/listaPeliculas?${query({ listaId: normalizeId(listId), tmdbId: movieId })}`)
        await Promise.all(relations.map((item) => request(`/listaPeliculas/${encodeURIComponent(item.id)}`, { method: 'DELETE' })))
      })
    },
  }
}

const service = createLibraryService()
export const getMovieLibraryActions = service.getMovieActions
export const listFavorites = service.listFavorites
export const addFavorite = service.addFavorite
export const removeFavorite = service.removeFavorite
export const listWatchlist = service.listWatchlist
export const addToWatchlist = service.addToWatchlist
export const removeFromWatchlist = service.removeFromWatchlist
export const listCustomLists = service.listCustomLists
export const createCustomList = service.createCustomList
export const renameCustomList = service.renameCustomList
export const deleteCustomList = service.deleteCustomList
export const listMoviesInCustomList = service.listMoviesInCustomList
export const addMovieToCustomList = service.addMovieToCustomList
export const removeMovieFromCustomList = service.removeMovieFromCustomList

export const getLibraryErrorMessage = (error) => {
  if (error?.type === 'network') return 'No pudimos conectar con JSON Server. Comprueba que esté activo e inténtalo de nuevo.'
  if (error?.type === 'duplicate-list') return 'Ya tienes una lista con ese nombre.'
  if (error?.type === 'invalid-name') return 'Escribe un nombre válido para la lista.'
  if (error?.type === 'forbidden') return 'Esta lista no pertenece a tu cuenta.'
  if (error?.type === 'not-found') return 'El elemento ya no existe. Actualiza la biblioteca e inténtalo de nuevo.'
  return 'No pudimos completar la operación. Inténtalo de nuevo.'
}

export { LIST_TYPES }