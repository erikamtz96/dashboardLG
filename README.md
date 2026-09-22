# Dashboard de Prospección — Merari (sitio en vivo)

Sitio de varias páginas (no un solo archivo HTML), sin backend ni build step:

- `index.html` — Resumen (KPIs + tendencia semanal)
- `cargos.html` — Desglose por cargo
- `industria.html` — Desglose por industria
- `script.html` — Desglose por categoría de script (guía de scripts)
- `config.html` — Conectar el Sheet de Merari (sin tocar código)
- `app.js` — lógica compartida: lee el Sheet, normaliza cargos, calcula KPIs
- `nav.js` / `styles.css` — barra de navegación y estilos compartidos
- `chart.umd.min.js` — Chart.js incluido localmente (sin depender de ningún CDN)

Cada página trae su propia URL — puedes mandarle a José Antonio directo el
link de `cargos.html`, por ejemplo. La navegación de arriba te mueve entre
las cinco.

## Cómo conectarlo al Sheet de Merari (sin editar código)

1. Publica el sitio (pasos abajo).
2. Abre la URL pública → ve a la pestaña **Configuración** en el menú de arriba.
3. Sigue las 4 instrucciones en pantalla: abre el Sheet de Merari, confirma que
   esté compartido como **"Cualquier persona con el enlace — Lector"**, entra a
   cada una de las dos pestañas de bitácora, copia la URL completa de la barra
   del navegador (incluye `#gid=...`) y pégala en el campo correspondiente.
4. Clic en **"Probar conexión"** para confirmar que lee bien antes de guardar.
5. Clic en **"Guardar y entrar al dashboard"**.

Eso es todo — no hay que tocar `index.html` ni ningún archivo. La conexión
queda guardada en el navegador (localStorage), así que si abres el dashboard
desde otra computadora, hay que repetir esta configuración una vez ahí
también (es local a cada navegador, no se comparte automáticamente).

Cada vez que alguien abre cualquiera de las páginas, se vuelve a leer el
Sheet en ese momento — siempre está al día, no hay caché ni espera.

## Subir a GitHub

```bash
cd merari-dashboard
git init
git add .
git commit -m "Dashboard de prospección — Merari (sitio en vivo)"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/merari-dashboard.git
git push -u origin main
```

## Publicar en Vercel

1. vercel.com → "Add New" → "Project" → "Import Git Repository" →
   selecciona `merari-dashboard`.
2. Framework Preset: **Other** (sitio estático de varios HTML, sin build command).
3. Deploy. En ~30 segundos tienes la URL pública para compartir.

Cada `git push` a `main` vuelve a publicar automáticamente.

## Notas sobre los datos

- El desglose usa la columna **Industria** del log (completa al 100%) en vez
  de Sector/Subsector de la lista maestra — ese cruce por nombre de empresa
  solo cubre ~39% de los contactos.
- No existe todavía una columna de **"script usado"**: sin ella no se puede
  medir qué mensaje convierte mejor. Está detallado en el plan de trabajo de
  Merari — la columna ya está preparada en el Excel que se entregó antes.
- "Categoría de puesto" traía más de 50 variantes de formato; `app.js` las
  normaliza a 10 categorías con las mismas reglas que se usaron para el
  Excel, así que los números de ambos coinciden.

## Si algo no carga

Cada página muestra el error exacto en pantalla:

- **"Todavía no conectaste el Sheet"** → ve a Configuración.
- **"No se pudo leer el Sheet (HTTP 404 o 403)"** → el Sheet no está
  compartido como "Cualquier persona con el enlace — Lector", o la URL no
  corresponde a una pestaña real.
- **Los números no cuadran** → en Configuración, confirma que las dos URLs
  apuntan a las pestañas de bitácora (no a la lista maestra de empresas).
