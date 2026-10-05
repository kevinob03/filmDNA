import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminUserForm from '../../src/components/admin/AdminUserForm.jsx'

jest.mock('../../src/services/adminUserService.js', () => ({
  ADMIN_USER_ROLES: ['usuario', 'psychologist', 'admin'],
}))

describe('AdminUserForm', () => {
  test('muestra errores y no envía un formulario de creación inválido', () => {
    const onSubmit = jest.fn()
    render(<AdminUserForm editingUser={null} isSaving={false} onCancel={jest.fn()} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))

    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText(/Ingresa un correo válido/i)).toBeInTheDocument()
    expect(screen.getByText(/Usa al menos 6 caracteres/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('envía los valores y limpia el formulario después de crear', async () => {
    const onSubmit = jest.fn().mockResolvedValue(true)
    render(<AdminUserForm editingUser={null} isSaving={false} onCancel={jest.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Mora' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'segura123' } })
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'psychologist' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Ana Mora',
      email: 'ana@example.com',
      password: 'segura123',
      role: 'psychologist',
    }))
    await waitFor(() => expect(screen.getByLabelText('Nombre')).toHaveValue(''))
    expect(screen.getByLabelText('Rol')).toHaveValue('usuario')
  })

  test('presenta el modo edición sin contraseña y permite cancelar', () => {
    const onCancel = jest.fn()
    render(<AdminUserForm editingUser={{ id: 7, nombre: 'Luis Solís', email: 'luis@example.com', role: 'admin' }} isSaving={false} onCancel={onCancel} onSubmit={jest.fn()} />)

    expect(screen.getByRole('heading', { name: 'Editar usuario' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Luis Solís')
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
