import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AccountMenu from '../../src/components/shared/AccountMenu.jsx'
import { useAuth } from '../../src/context/AuthContext.jsx'

jest.mock('../../src/context/AuthContext.jsx', () => ({ useAuth: jest.fn() }))

const user = { id: 1, nombre: 'Kevin Ortiz', role: 'admin' }
const renderMenu = () => render(<MemoryRouter><AccountMenu /></MemoryRouter>)

describe('AccountMenu', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user, logout: jest.fn() })
  })

  test('abre el menú y muestra identidad y acciones accesibles', () => {
    renderMenu()
    const trigger = screen.getByRole('button', { name: /Abrir menú de cuenta de Kevin Ortiz/i })

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Kevin Ortiz')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Perfil/i })).toHaveAttribute('href', '/perfil')
  })

  test('cierra sesión desde el menú', () => {
    const logout = jest.fn()
    useAuth.mockReturnValue({ user, logout })
    renderMenu()

    fireEvent.click(screen.getByRole('button', { name: /Abrir menú/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Cerrar sesión/i }))

    expect(logout).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('Escape cierra el menú y devuelve el foco al botón', async () => {
    renderMenu()
    const trigger = screen.getByRole('button', { name: /Abrir menú/i })
    fireEvent.click(trigger)

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })
})
