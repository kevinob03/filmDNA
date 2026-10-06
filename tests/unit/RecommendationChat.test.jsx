import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import RecommendationChat from '../../src/components/recommendations/RecommendationChat.jsx'
import { sendRecommendationChatMessage } from '../../src/services/recommendations/recommendationChatService.js'

jest.mock('../../src/services/recommendations/recommendationChatService.js', () => ({
  createRecommendationChatSessionId: () => 'session_component_test',
  sendRecommendationChatMessage: jest.fn(),
}))

jest.mock('../../src/services/recommendations/personalAIConfigStorage.js', () => ({
  clearPersonalAIConfig: jest.fn(),
  clearPersonalAIPreference: jest.fn(),
  readPersonalAIConfig: jest.fn(() => null),
  readPersonalAIPreference: jest.fn(() => null),
  savePersonalAIConfig: jest.fn(),
}))

const renderChat = (changes = {}) => {
  const props = { filters: {}, movies: [], onAction: jest.fn(), ...changes }
  return { ...render(<RecommendationChat {...props} />), props }
}

describe('RecommendationChat', () => {
  beforeEach(() => {
    sendRecommendationChatMessage.mockReset()
  })

  test('abre y cierra el panel accesible desde el lanzador', () => {
    renderChat()
    const launcher = screen.getByRole('button', { name: 'Chat FilmDNA' })

    fireEvent.click(launcher)
    expect(screen.getByRole('dialog', { name: 'Habla con FilmDNA' })).toBeInTheDocument()
    expect(screen.getByText(/no incluye tu correo/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar chat' }))
    expect(screen.queryByRole('dialog', { name: 'Habla con FilmDNA' })).not.toBeInTheDocument()
  })

  test('envía un mensaje, muestra la respuesta y publica la acción', async () => {
    const response = {
      action: 'refine',
      reply: 'Buscaré una comedia corta.',
      suggestedReplies: ['Que sea reciente'],
      filtersPatch: { genres: ['35'] },
      clearFilters: [],
      targetMovieId: null,
    }
    sendRecommendationChatMessage.mockResolvedValue(response)
    const onAction = jest.fn()
    renderChat({ filters: { duration: 'under-90' }, onAction })
    fireEvent.click(screen.getByRole('button', { name: 'Chat FilmDNA' }))

    fireEvent.change(screen.getByLabelText('Mensaje para FilmDNA'), { target: { value: 'Quiero algo divertido' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await screen.findByText('Buscaré una comedia corta.')
    expect(sendRecommendationChatMessage).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'session_component_test',
      message: 'Quiero algo divertido',
      history: [],
      filters: { duration: 'under-90' },
    }))
    expect(onAction).toHaveBeenCalledWith(response)
    expect(screen.getByRole('button', { name: 'Que sea reciente' })).toBeInTheDocument()
  })

  test('muestra un error seguro y permite reintentar', async () => {
    sendRecommendationChatMessage.mockRejectedValue(new Error('fallo interno'))
    renderChat()
    fireEvent.click(screen.getByRole('button', { name: 'Chat FilmDNA' }))
    fireEvent.change(screen.getByLabelText('Mensaje para FilmDNA'), { target: { value: 'Recomiéndame algo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/respuesta no válida/i)
    await waitFor(() => expect(screen.getByLabelText('Mensaje para FilmDNA')).not.toBeDisabled())
    expect(screen.getByRole('button', { name: 'Quiero algo divertido' })).not.toBeDisabled()
  })
})
