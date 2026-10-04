# FilmDNA

FilmDNA es una plataforma de descubrimiento cinematográfico construida con React. Combina datos reales de TMDB con módulos propios que se incorporan de forma progresiva.

## Estructura React

La interfaz respeta una dirección de composición única y verificable:

```text
src/components → src/pages → src/routes → src/App.jsx → src/main.jsx → index.html
```

- `components/` contiene las piezas reutilizables y de presentación.
- `pages/` compone esas piezas para formar cada pantalla; también contiene la página raíz y las páginas de control de acceso.
- `routes/` importa páginas y define toda la navegación.
- `App.jsx` importa únicamente la capa de rutas.
- `main.jsx` monta `App` en el elemento `#root` de `index.html`.

La regla puede comprobarse automáticamente con `npm run test:structure`.

## Desarrollo local

1. Instala las dependencias con `npm install`.
2. Copia `.env.example` como `.env` y configura tu API key local de TMDB. No compartas ni subas ese archivo.
3. Inicia el backend simulado en una terminal:

   ```bash
   npm run server
   ```

4. Inicia la aplicación en otra terminal:

   ```bash
   npm run dev
   ```

La aplicación usa `VITE_API_URL=http://localhost:3001` como URL predeterminada para JSON Server.

## Cuentas demo locales

Estas cuentas existen únicamente en `db.json` para comprobar roles durante el desarrollo académico:

| Rol | Correo | Contraseña demo |
| --- | --- | --- |
| Administrador | `admin@filmdna.local` | `demo-admin-123` |
| Usuario | `usuario@filmdna.local` | `demo-usuario-123` |

La autenticación y autorización son demostrativas: dependen del frontend, `localStorage` y JSON Server. Las contraseñas se almacenan como texto plano en el archivo local y este mecanismo no ofrece seguridad de servidor ni debe utilizarse en producción.
