
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Rutas

| URL | Sección |
| --- | --- |
| `/` | Inicio |
| `/talento` | Talento y Habilidades |
| `/cadena-valor` | Áreas y Actividades |
| `/puestos`, `/puestos/:jobCode` | Puestos y Perfiles |
| `/personas`, `/personas/:employeeId`, `/personas/:employeeId/evaluar` | Personas (ficha y evaluación) |
| `/reclutamiento`, `/reclutamiento/:jobCode` | Selección de Personal |
| `/desempeno` | Desempeño |
| `/capacitacion` | Capacitación |
| `/reportes` | Informes |

Para agregar un módulo: declararlo en `src/routes.ts`, crear `src/pages/<Modulo>.tsx` y sumar su `<Route>` en `src/App.tsx`.

**Producción:** al ser una SPA, el servidor debe devolver `index.html` para cualquier ruta (fallback); de lo contrario, recargar `/personas` daría 404. `vite dev` y `vite preview` ya lo hacen.
