# Text the Check — Marketing Backlog

**Window:** 30 days starting Tuesday 2026-04-22 → Wednesday 2026-05-21
**Channels:** Instagram (@textthecheck) + landing (textthecheck.app)
**Voice:** amigo financieramente piola, vos argentino, lunfardo sin forzar, no es un banco.
**Visual contract:** dark mode primero, **paleta "Buenos Aires Night" — warm, no corporate blue-black**. Fondo `#14110F` / superficies `#1C1815` / texto cálido `#F0EBE3`. Primario `#4A90D9` ("the" en el wordmark, CTAs). Acento `#E8533F` (mismo hex que danger — ver alerta en §8). Siempre lowercase para el wordmark. Números como héroe en Nunito 800. Recibito es el personaje — stroke-based, `currentColor`, rounded caps, ojitos asimétricos.
**Fuente de verdad visual:** `brand-audit.md` (sistema live en `client/`) + `docs/brand/BrandDesignManual` (intención).

---

## 1. Product understanding

**Core value proposition (mi lectura):**
Divides gastos en grupo mandándole un mensaje a un bot de WhatsApp — la IA entiende lunfardo, @menciones y cotización blue, y te dice exactamente quién le debe cuánto a quién con la menor cantidad de transferencias posible.

**Top 5 flows del first-week:**
1. **Sign-in por WhatsApp OTP** (`/iniciar-sesion`) — número → código → listo. Google auth opcional con merge de cuenta WhatsApp.
2. **Crear primer grupo** (`CreateGroupModal.vue`) — nombre ("Viaje a Bariloche") + ghost members por nombre (antes de que entren al app).
3. **Cargar primer gasto por WhatsApp** — "pagué 8 lucas de la birra con @Gonza" → confirmación IA → guardado. Fallback web: `ExpenseModal.vue` con moneda, monto, categoría, participantes.
4. **Ver balance + settlements** (`/grupos` dashboard) — dos tabs (Inicio / Grupo), toggle de simplificación de deudas, modal con CBU/CVU del que cobra.
5. **Invitar / claim de ghost members** (`/unirse?group=X`) — el invitado ve "¿sos alguno de estos?" y hereda los gastos ya cargados.

**Features built pero underexposed en la landing (IG gold):**
- **Ghost members** — agregás a alguien sin WhatsApp y la persona claimea la cuenta después. *Feature más distintiva que tienen y la landing no la menciona.*
- **Resúmenes semanales con insight de IA** — el server tiene un cron (`send-weekly-summary.ts`) que manda push + WhatsApp con análisis de gastos. Nadie sabe que existe.
- **Audio + recibo por foto** — `transcribeAudio()` y `parseTransferImage()` en Gemini. Podés mandarle un audio o una foto del comprobante y lo parsea. Invisible en la landing.
- **Aliases / @menciones fuzzy** (Fuse.js) — podés decir "Gonza" o "gonzalo" y lo resuelve. Se menciona pero no se demuestra.
- **Simplificación de settlement** — el toggle existe pero la landing lo menciona como bullet, no como demo visual.
- **Modo Finanzas completo** — categorización, recurrentes (`FIJOS`), análisis financiero con Gemini, templates de transferencia. Está en el backend, **no existe en la landing**. Es territorio virgen de contenido.

---

## 2. Audience hypothesis

**Primario (Grupos):** 22-34, urbanos argentinos, viajan con amigos mínimo 1-2 veces por año, comparten alquiler o expensas, hacen asados/previas donde alguien siempre termina poniendo de más. Heavy users de WhatsApp, tolerancia cero a instalar una app más.

**Secundario (Finanzas — cuando se lance):** 25-40, freelance o sueldo bimonetario, ya usa Mercado Pago + Ualá + algún banco tradicional, abre Excel una vez al mes y lo abandona.

**Qué reemplaza:** el grupo de WhatsApp "Gastos Bariloche 2026" con una nota de voz cada 4 horas; la planilla compartida que nadie actualiza después del día 2; la matemática mental del "che pero yo puse el airbnb"; Splitwise (demasiado yanqui, no entiende lunfardo, hay que instalarlo).

**Persona en una línea (voz TTC):**
*"Vos sos el que siempre termina anotando los gastos del viaje en Notes y después peleando por 400 mangos que nadie sabe de dónde salieron. Ya está, no sos más vos."*

---

## 3. Content pillars

| # | Pilar | Una línea | % del calendario |
|---|-------|-----------|------------------|
| 1 | **Producto en acción** | Demos, tutoriales, "qué entiende la IA" | 30% (~9 posts) |
| 2 | **Escenas reales** | Momentos plata argentinos donde TTC encaja solo | 30% (~9 posts) |
| 3 | **Cultura plata** | Blue dollar, quincena, fin de mes, comparativas con Splitwise | 20% (~6 posts) |
| 4 | **Build in public** | Founders, decisiones, roadmap (Finanzas teaser) | 10% (~3 posts) |
| 5 | **Comunidad** | UGC, screenshots, polls, stories | 10% (~3 posts) |

### Pilar 1 — Producto en acción (30%)
Idea 1 · Reel de 20s grabando el flow completo: texto al bot → confirmación → balance actualizado.
Idea 2 · Carrusel "8 cosas que la IA entiende": "pagué 8 lucas", "dividilo entre los 4", "la cena de anoche con @gonza", "puse 50 dólares", etc.
Idea 3 · Reel estilo "probamos decirle X y Y" — hacemos un set de frases raras y mostramos el output.

### Pilar 2 — Escenas reales (30%)
Idea 1 · "Cuando el grupo de Bariloche tiene 47 mensajes sin leer" → screenshot chat caótico → screenshot TTC ordenado.
Idea 2 · "El amigo que nunca pasa la plata" — carrusel formato meme, último slide: "ya no más, ghost member + recordatorio".
Idea 3 · "Asado del viernes: pasos para que no haya bardo" — carrusel con el flow del app.

### Pilar 3 — Cultura plata (20%)
Idea 1 · Post reactivo cada vez que el blue cruza un número redondo. "Blue a $X. Si dividís la cena en USD, TTC ya lo convierte." (Template reutilizable.)
Idea 2 · Carrusel "Splitwise vs text the check" lado a lado, 6 slides.
Idea 3 · Post "quincena starter pack" — qué revisar el día 15 y el día 30.

### Pilar 4 — Build in public (10%)
Idea 1 · Carrusel "Por qué armamos esto" — foto de la planilla que los hizo renunciar.
Idea 2 · Teaser Finanzas: "Estamos construyendo algo nuevo. Contanos qué querés ver."
Idea 3 · Post con la decisión de por qué usamos Gemini y no OpenAI (honest founder post).

### Pilar 5 — Comunidad (10%)
Idea 1 · Story template semanal: "Mandá un screenshot de tu grupo más caótico, lo posteamos anónimo".
Idea 2 · Testimonial visual con chat real (con permiso).
Idea 3 · Poll de stories: "¿quién en tu grupo necesita esto urgente?".

---

## 4. 30-day Instagram calendar

*Tonos: negrita = cornerstones reutilizables. Argentina holidays dentro del rango: 1/5 Día del Trabajador (feriado), 2/5 puente opcional. 25/5 (Día de la Revolución) cae el día 34, fuera de rango — tease en día 30.*

| Día | Fecha | Formato | Pilar | Hook/angle | Asset necesario |
|-----|-------|---------|-------|------------|-----------------|
| **1** | Mar 22/4 | **Carrusel 8 slides** | Producto | **"Cómo funciona text the check en 60 segundos"** — slide 1 pregunta "¿sigues usando Excel para los viajes?", slides 2-7 el flow completo con captures, slide 8 CTA WhatsApp | **Cornerstone: carrusel master (reusable)** |
| 2 | Mié 23/4 | Reel 15s | Producto | "Le dijimos 'pagué 8 lucas de la birra' y esto pasó" — pantalla partida: mensaje WhatsApp arriba, balance actualizándose abajo | Reel frames (4 beats) |
| 3 | Jue 24/4 | **Carrusel 6 slides** | Cultura plata | **"Splitwise vs text the check, lado a lado"** — cada slide un feature, TTC gana | **Cornerstone: comparativa** |
| 4 | Vie 25/4 | Post único | Escenas reales | "Viernes 19:47. El chat del asado ya tiene 23 mensajes. Uno dice 'después arreglamos'. Nunca arreglan." → CTA | Single post |
| 5 | Sáb 26/4 | **Reel 20s** | Producto | **Screen record del flow completo sin cortes: WhatsApp → confirmación → balance → settlement** | **Cornerstone: demo reel** |
| 6 | Dom 27/4 | Story template | Comunidad | Poll: "¿Quién en tu grupo es el contador improvisado? 🔴 yo 🟢 otro" → reshare | Story template (reusable) |
| 7 | Lun 28/4 | Post único | Cultura plata | "Lunes. El grupo de 'Gastos Bariloche 2026' sigue abierto desde febrero. Año pasado. Cerralo." | Single post |
| 8 | Mar 29/4 | Carrusel 7 slides | Escenas reales | "Fin de mes post-mortem: las 5 transferencias que te faltan" — cada slide una excusa clásica | Carrusel (M) |
| 9 | **Mié 30/4** | Reel 12s | Cultura plata | **Fin de mes**: "Cobraste. Antes de gastártelo, revisá quién te debe de marzo." Pantalla del balance | Reel frames (3 beats) |
| 10 | **Jue 1/5** | Post único | Escenas reales | **Día del Trabajador**: "Feriado = asado = alguien pone la carne, otro las bebidas, otro el carbón. Que la plata no arruine el finde." | Single post (template feriado, reusable) |
| 11 | Vie 2/5 | Reel 15s | Escenas reales | **Puente XL starter pack**: escapada de 3 días, 4 personas, 1 grupo TTC | Reel frames (5 beats) |
| 12 | Sáb 3/5 | Carrusel 5 slides | Producto | "Cómo dividir un viaje de 6 personas sin que nadie quede enojado" — mini-tutorial con ghost members | Carrusel (M) |
| 13 | Dom 4/5 | Story template | Comunidad | "Mandanos tu grupo más caótico 📸 (lo posteamos anónimo)" | Story template (reusable) |
| 14 | Lun 5/5 | Post único | Producto | **Feature spotlight: ghost members**. "Podés agregar a alguien sin WhatsApp. Cuando entre, hereda todos sus gastos." Pocos lo saben. | Single post (S) |
| 15 | Mar 6/5 | Reel 20s | Producto | "Probamos decirle a la IA las frases más argentinas que se nos ocurrieron" — 5 frases, 5 confirmaciones | Reel frames (5 beats) |
| 16 | Mié 7/5 | Carrusel 8 slides | Escenas reales | "8 gastos del grupo que siempre terminan mal sin una app" — meme format, TTC como solución en slide 9 | Carrusel (M) |
| 17 | Jue 8/5 | Post único | Cultura plata | **Reactivo blue dollar** (template): "Blue cerró a $X. Si viajaste con amigos y pusieron USD, TTC ya convirtió al blue del día." | Single post (template reusable) |
| 18 | Vie 9/5 | Reel 18s | Escenas reales | "Viernes, 4 personas, 1 cena, 1 mensaje al bot" — POV desde la mesa del bar | Reel frames (4 beats) |
| 19 | Sáb 10/5 | Carrusel 6 slides | Build in public | "Por qué armamos esto (Andrea + Imanol)" — foto planilla vieja, decisión, roadmap | Carrusel (L) |
| 20 | Dom 11/5 | Story template | Comunidad | "Etiquetá al del grupo que siempre se olvida de pasar la plata" | Story template (reusable) |
| 21 | Lun 12/5 | Post único | Comunidad | Testimonial UGC — screenshot chat real (con permiso), frame custom | Single post (M) |
| 22 | Mar 13/5 | Reel 15s | Producto | "Mandale un audio al bot y mirá qué pasa" — feature de transcripción que **nadie sabe que existe** | Reel frames (4 beats) |
| 23 | Mié 14/5 | Carrusel 5 slides | Cultura plata | "Quincena plan de ataque: las 3 cosas que revisás el día 15" | Carrusel (M) |
| 24 | **Jue 15/5** | Post único | Cultura plata | **Quincena**: "Cobraste. 3 gastos del grupo que seguro te olvidaste de sumar." | Single post (template reusable) |
| 25 | Vie 16/5 | Reel 12s | Producto | "Mandale una foto del comprobante de la transferencia" — feature vision parsing, demo 10s | Reel frames (3 beats) |
| 26 | Sáb 17/5 | Carrusel 6 slides | Build in public | **Teaser Finanzas mode**: "Estamos armando algo nuevo para tu plata personal. Mirá." 5 slides de preview + slide CTA "qué querés ver" | Carrusel (L) |
| 27 | Dom 18/5 | Story template | Comunidad | Open question: "¿Qué feature de Finanzas querés primero? Recurrentes / Categorías / Resumen semanal" | Story template (reusable) |
| 28 | Lun 19/5 | Reel 20s | Escenas reales | "Un día normal de un usuario de TTC" — POV, 4 interacciones rápidas con el bot | Reel frames (4 beats) |
| 29 | Mar 20/5 | Post único | Producto | **Feature spotlight: simplificación de deudas**. "En vez de 7 transferencias, 2. La app calcula el camino más corto." | Single post (M) |
| 30 | Mié 21/5 | Carrusel 7 slides | Cultura plata | "Finde XL del 25 de mayo: el plan financiero" — tease del próximo finde largo + recap de mejores posts del mes | Carrusel (M) + recap asset |

**Cornerstones identificados (semana 1):**
- Día 1 carrusel "Cómo funciona" → se corta en 3 reels, 1 story set, 1 post feature
- Día 3 carrusel "Splitwise vs TTC" → se reusa en ads, se corta en singles por feature
- Día 5 reel demo → se corta en 3 clips de 8s para stories

---

## 5. Asset production list (deduplicated)

### Carruseles (8 únicos)
| # | Tema | Slides | Complejidad |
|---|------|--------|-------------|
| C1 | Cómo funciona TTC en 60s (cornerstone) | 8 | **L** — layout maestro + 6 capturas compuestas |
| C2 | Splitwise vs TTC lado a lado (cornerstone) | 6 | **M** |
| C3 | Fin de mes post-mortem | 7 | M |
| C4 | Dividir viaje de 6 personas | 5 | M |
| C5 | 8 gastos que salen mal sin app | 8 | M |
| C6 | Por qué armamos esto (founders) | 6 | **L** — foto real + retratos + timeline |
| C7 | Quincena plan de ataque | 5 | M |
| C8 | Teaser Finanzas mode | 6 | **L** — mockups nuevos de pantallas que no existen en landing |
| C9 | Finde XL 25 de mayo + recap | 7 | S — recicla assets de C1-C8 |

### Single posts (8 únicos + 3 templates reutilizables)
| # | Tema | Complejidad |
|---|------|-------------|
| S1 | "Chat de Bariloche sigue abierto desde febrero" | S |
| S2 | **Template feriado/finde largo** (reusable) | M (template), S por uso |
| S3 | Feature spotlight: ghost members | S |
| S4 | **Template blue dollar reactivo** (reusable) | M (template), S por uso |
| S5 | **Template quincena/fin de mes** (reusable) | M (template), S por uso |
| S6 | Testimonial UGC frame | M — frame nuevo, reusable para próximos UGC |
| S7 | Feature spotlight: simplificación de deudas | S |
| S8 | "Viernes 19:47, chat del asado" | S |

### Reel frame sets (10 únicos)
| # | Tema | Beats/frames | Complejidad |
|---|------|--------------|-------------|
| R1 | "Pagué 8 lucas de la birra" → balance update | 4 | M |
| R2 | **Screen record demo completa (cornerstone)** | 6 | L |
| R3 | Cobraste → revisá quién te debe | 3 | S |
| R4 | Puente XL starter pack | 5 | M |
| R5 | IA entiende 5 frases argentas random | 5 | M |
| R6 | POV cena 4 personas → 1 mensaje | 4 | M |
| R7 | Audio al bot → transcripción → gasto | 4 | M |
| R8 | Foto de comprobante → parsing | 3 | M |
| R9 | Un día normal de un usuario TTC | 4 | M |
| R10 | Overlay template para reactivos (blue, feriado) | 2 | S — reusable |

### Story templates (4 reutilizables)
| # | Tema | Complejidad |
|---|------|-------------|
| ST1 | Poll "¿quién es el contador del grupo?" | S |
| ST2 | "Mandanos tu grupo más caótico" (con drop zone) | M — reusable semanal |
| ST3 | "Etiquetá al que nunca pasa la plata" | S |
| ST4 | Open question Finanzas (qué feature querés) | S |

**Total assets únicos: 9 carruseles + 8 singles + 10 reel sets + 4 story templates = 31 piezas.**

---

## 6. Landing page SVG needs (+ assets que destraban IG)

El audit es explícito sobre tres gaps que impactan tanto landing como IG:
(a) **Recibito tiene solo 2 estados emocionales** (confused, overwhelmed) — faltan waving, thinking, celebratory, counting, scanning-receipt, holding-phone, sleeping.
(b) **Recibito siempre aparece solo** — no hay escenas con celular, con grupo de amigos, con pila de recibos.
(c) **No existen templates de Instagram** (1:1, 9:16, 4:5) con brand-chrome definido — cada post arranca de cero.

Prioricé la expansión de Recibito + templates IG porque destraban todo lo demás. Los 8 SVGs de landing están abajo.

### 6.1 Recibito character set (expansión del mascot)
| # | Estado | Uso primario | Complejidad |
|---|--------|--------------|-------------|
| R-char1 | **Waving / saludando** | Landing hero, IG avatar, cierre de reels | M |
| R-char2 | **Thinking (pensando, `?` flotante v2)** | How it works paso 2 (IA procesando) | S — variante del `confused.svg` |
| R-char3 | **Celebratory (brazos arriba, `✓` flotante)** | "Todos al día" state, IG post de settlement | M |
| R-char4 | **Counting (con dedos / números flotantes)** | IG post "números son el héroe", resumen semanal | M |
| R-char5 | **Holding phone** | Hero alternativo, demos "mandale un mensaje" | M |
| R-char6 | **Scanning receipt (otro recibo en la mano)** | Feature comprobante por foto, IG post audio/imagen | L — primera escena con prop |
| R-char7 | **Sleeping** | Footer signoff, story "modo descanso fin de mes" | S |

### 6.2 Scene compositions (Recibito + otros)
| # | Escena | Uso | Complejidad |
|---|--------|-----|-------------|
| R-scene1 | **Recibito + grupo de 3 amigos estilizados** | Landing sección Grupos, IG carrusel "dividir viaje" | L |
| R-scene2 | **Recibito + pila de recibos caóticos** | IG post "antes / después", empty state caótico | L |
| R-scene3 | **Recibito + celular con burbuja WhatsApp** | Hero alternativo, reels cover | M |
| R-scene4 | **Recibito + calendario (para Finanzas)** | Teaser Finanzas mode, landing duo | M |

### 6.3 Instagram brand-chrome templates
*El audit marca esto como recomendación explícita (§8.1). Cero templates hoy → cada AI-gen arranca sin guardrails.*

| # | Template | Specs | Complejidad |
|---|----------|-------|-------------|
| IG-T1 | **1:1 post frame (1080×1080)** | Safe-zones, wordmark corner, Recibito focal rule, bg `#14110F` (dark) + variante `#FBF8F3` (cream) | M |
| IG-T2 | **9:16 story frame (1080×1920)** | Header + footer safe-areas (evitar overlap con UI de IG), zona drop-screenshot | M |
| IG-T3 | **4:5 reel cover (1080×1350)** | Cover para reels con título fluido (Nunito 800), wordmark pinneado | M |
| IG-T4 | **Carousel consistency sheet** | Slide 1 (hook), slide N (CTA WhatsApp), colores de fondo permitidos, dónde va "the" en azul | M |

### 6.4 Decorative patterns & utilities
| # | Asset | Uso | Complejidad |
|---|-------|-----|-------------|
| PAT1 | **Receipt-edge pattern (dientes/perforación)** | Dividers de sección en landing, borders de IG posts | S |
| PAT2 | **Warm dot-grid texture** | Background opcional en IG (romper el fondo sólido sin gradients) | S |
| PAT3 | **`palette.json` export** | Todos los `ttc-*` tokens (dark+light+intent) en JSON | S — pero unlock masivo para handoff a tools |

### 6.5 Landing page SVGs (secciones específicas)
| # | Ilustración / spot | Sección | Concepto | Por qué ayuda |
|---|--------------------|---------|----------|---------------|
| SVG1 | **Recibito hero con celular** (= R-scene3) | `LandingHero.vue` — complementa `WhatsAppHeroDemo` | Recibito saludando + burbuja WhatsApp flotando | Rompe con el look fintech genérico del mockup solo |
| SVG2 | **Duo Grupos / Finanzas** (= R-scene1 + R-scene4) | Sección modos (hoy no existe en landing, hay que crearla) | Dos Recibitos: uno con amigos, otro con calendario | Introduce Finanzas mode antes del lanzamiento |
| SVG3 | **3 pictogramas How it works** | `LandingHowItWorks.vue` | Paso 1 mano+celu / Paso 2 Recibito thinking (= R-char2) / Paso 3 grupo + número | Hoy son solo mocks de chat, falta ritmo visual |
| SVG4 | **Comparativa — tabla con personaje** | `LandingComparison.vue` | Recibito firme vs ícono corporate gris genérico (no nombrar Splitwise explícito) | Personaliza un bullet list plano |
| SVG5 | **Ghost member** | Nueva sub-sección en features o inline en card | Silueta translúcida que se solidifica ("antes de unirse / después") | Feature más distintivo del producto, hoy invisible en landing |
| SVG6 | **Set de 10 íconos custom 64×64** | `LandingFeaturesExpanded.vue` reemplaza Lucide genéricos | Blue dollar, @mención, ghost member, settlement simplificado, audio, foto comprobante, resumen semanal, multi-currency, recurrentes, categorías | Mata el look "otro fintech genérico con iconos Lucide" |
| SVG7 | **Frame testimonial / social proof** | `LandingSocialProof.vue` | Marco tipo burbuja WhatsApp con Recibito chiquito al lado del quote | Hoy es texto; merece identidad visual |
| SVG8 | **Recibito footer signoff** (= R-char7 en contexto) | Footer | Recibito durmiendo sobre el wordmark, receipt-edge pattern abajo | Cierre cálido |

**Total de producción visual mensual:** 7 Recibito chars + 4 scenes + 4 IG templates + 3 patterns + 8 landing SVGs = **26 piezas visuales** (varios reutilizados en IG y landing, no doble esfuerzo).

---

## 7. Production priority

*Estimaciones asumiendo Claude Design hace el lift pesado y vos iterás. Horas = tiempo de Andrea revisando + ajustando.*

### Wave 1 — semana 1 (cornerstones + unblockers)
*Razón: los templates IG + el set base de Recibito destraban todo lo demás. Sin ellos, cada asset de Wave 2/3 se diseña desde cero.*

**Instagram foundations (unblockers):**
- **IG-T1, T2, T3, T4** templates brand-chrome (4 × M) — una vez hechos, cada post futuro parte desde acá
- **PAT3 `palette.json`** export (S) — 30 min de trabajo, unlock para cualquier AI tool
- **R-char1 Waving, R-char2 Thinking, R-char5 Holding phone** (3 chars base) — cubren los cornerstones de contenido

**Cornerstones de contenido:**
- C1 Carrusel "Cómo funciona" (L)
- C2 Carrusel "Splitwise vs TTC" (M)
- R2 Reel demo completo (L)
- S1 "Chat de Bariloche" (S), S3 Feature ghost members (S), R1 Reel "8 lucas" (M), ST1 Story poll (S)

**Landing SVGs (máximo leverage):**
- **SVG6 Set 10 íconos feature grid** (M) — el cambio más visible en la landing
- **SVG3 3 pictogramas How it works** (M) — usa R-char2 thinking
- **SVG1 Recibito hero con celular** (L) — usa R-char5

**Estimado: 18-24 hs de iteración.**

### Wave 2 — semanas 2-3 (calendar fill + escenas + landing interior)
**Recibito expansion:**
- **R-char3 Celebratory, R-char4 Counting, R-char6 Scanning receipt** (3 × M-L)
- **R-scene1 Recibito + amigos, R-scene2 + pila de recibos, R-scene3 + celular** (3 escenas, L/L/M)

**Contenido:**
- C3, C4, C5, C7 carruseles (4 × M)
- S2, S4, S5 templates reutilizables (3 × M) — inversión que paga en mayo/junio
- S6 testimonial frame (M), S7 simplificación (S), S8 viernes 19:47 (S)
- R3, R4, R5, R6, R9 reels (5 × M, 1 × S)
- ST2 drop-zone grupo caótico (M), ST3 etiquetá al que no paga (S)

**Landing:**
- **SVG4 comparativa con personaje** (M)
- **SVG5 ghost member** (M)
- **SVG2 duo Grupos/Finanzas** (L) — usa R-scene1 + nuevo R-scene4
- **PAT1 receipt-edge pattern** (S) — dividers para toda la landing
- **PAT2 warm dot-grid** (S)

**Estimado: 26-34 hs.**

### Wave 3 — semana 4 (Finanzas teaser + nice-to-haves)
**Assets:**
- **R-char7 Sleeping** (S), **R-scene4 Recibito + calendario (Finanzas)** (M)
- C6 Founders "por qué armamos esto" (L) — requiere foto real + retratos
- C8 Teaser Finanzas mode (L) — mockups nuevos de pantallas que aún no existen en UI
- C9 Finde XL + recap (S, recicla)
- R7 audio → gasto (M), R8 foto comprobante (M), R10 overlay reactivo (S)
- ST4 open question Finanzas (S)
- **SVG7 testimonial frame** (M)
- **SVG8 Recibito footer signoff** (S) — usa R-char7

**Estimado: 12-16 hs.**

**Total del mes: ~56-74 hs de iteración repartidas en 4 semanas.** (Subió desde la estimación anterior porque el Recibito expansion + templates IG son trabajo real que no había contabilizado.)

---

## 8. Open questions (decidir antes de producir)

1. **¿Launch moment o steady-state growth?** Finanzas teaser en día 26 asume que hay algo que revelar en ~2 semanas. Si no hay fecha de beta abierta, cambiamos ese slot por más contenido Grupos. ¿Cuándo sale Finanzas públicamente?

2. **¿Founders en cámara?** Varios reels/carruseles ganan 10x si sos vos hablando (Andrea + Imanol "por qué armamos esto", IA probando lunfardo, POV de un día normal). Si no hay apetito para cara a cámara, reemplazo por animación de Recibito y voz en off.

3. **¿Permitido mencionar Splitwise por nombre?** El brand manual dice "approachable, not clever"; un carrusel de comparativa directa funciona mejor con el nombre, pero puede traer ruido. Alternativa: "la otra app" / ícono genérico. ¿Cuál preferís?

4. **¿Hay UGC real o hay que simularlo?** S6 + día 21 asumen screenshot de un chat real de un usuario. Si todavía no hay, o no hay permiso, reemplazamos por testimonial estilizado (escrito, no screenshot).

5. **¿Integración con Mercado Pago es tema público?** El brand doc dice "no reemplazamos MP, lo complementamos". Si hay acuerdo, partnership o mención, hay 2-3 posts más de altísimo impacto. Si no, evitamos.

6. **¿Métrica norte del mes?** Followers, clics a la landing, sign-ups vía IG, shares. Cambia qué optimizamos en CTAs y stories.

7. **¿Resolvemos el colour-collision antes de producir, o después?** El audit flagea dos conflictos que afectan directamente cómo se ven los assets: (a) `ttc-danger` y `ttc-accent` son el mismo hex `#E8533F` — si usamos acento rojo-naranja en IG, visualmente compite con errores. (b) tres verdes diferentes (`#25D366` WhatsApp, `#1FAD54` success, `#10B981` categoría shopping) sin una "nuestra verde" canónica. Preferís que elija una por pieza (riesgo: drift) o esperamos a que definas canon antes de empezar Wave 1?

8. **¿Metadata y wordmark pueden divergir en captions?** El audit muestra que `nuxt.config.ts:40` usa "Text the Check" (Title Case) pero `AppLogo.vue` siempre es lowercase. Para captions de IG: ¿siempre lowercase (fiel al logo), o Title Case en títulos y lowercase solo en el wordmark renderizado?

---

*Última actualización: 2026-04-21 — v1.0*
