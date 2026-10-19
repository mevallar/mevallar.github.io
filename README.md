# Mevallar — Web Oficial

Sitio estático de la banda Mevallar, publicado en mevallar.com vía GitHub Pages.

## Estructura

- `src/` — páginas escritas a mano (landing, merch, links) y la hoja de estilos compartida.
- `data/concerts.js` — fuente única de datos de conciertos.
- `templates/` — plantillas HTML con tokens `{{...}}` para las páginas de conciertos.
- `scripts/build-site.js` — script de Node (sin dependencias npm) que genera todo en `dist/`.
- `dist/` — resultado del build, no se versiona. Es lo único que publica GitHub Pages.

## Desarrollo local

```bash
node scripts/build-site.js
```

Abre `dist/index.html` en el navegador, o sirve `dist/` con cualquier servidor estático.

## Tests

```bash
node --test scripts/build-site.test.js
```

## Añadir un concierto

Añade una entrada a `data/concerts.js` siguiendo la forma de las existentes y vuelve a ejecutar el build. El estado "próximo"/"anterior" se calcula automáticamente a partir del campo `date` — no hace falta marcarlo a mano.

## Despliegue

Cada push a `main` lanza `.github/workflows/deploy.yml`, que ejecuta los tests, construye el sitio y publica `dist/` vía GitHub Pages.

**Paso manual único:** en los ajustes del repositorio, ve a Settings → Pages → Build and deployment → Source, y selecciona "GitHub Actions" (no "Deploy from a branch"). Sin este cambio, el paso de despliegue del workflow fallará aunque el build se complete correctamente.
