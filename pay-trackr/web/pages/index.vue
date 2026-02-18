<template>
  <div class="flex flex-col">
    <!-- Hero Section -->
    <section class="max-w-7xl m-auto w-full px-6 py-12 md:py-20">
      <div class="flex flex-col md:flex-row md:items-center gap-12">
        <!-- Left: copy -->
        <div class="flex flex-col gap-6 md:w-1/2">
          <h1 class="hero-title">
            Seguí tus pagos de forma
            <span class="text-primary">simple</span>
          </h1>
          <p class="text-gray-400 text-lg leading-relaxed max-w-lg">
            Registrá gastos por WhatsApp, recibí resúmenes semanales con IA y nunca más te pierdas un pago.
          </p>
          <div class="flex items-center gap-4 pt-2">
            <NuxtLink
              to="/welcome?redirect=/"
              class="inline-flex items-center gap-2 bg-primary hover:bg-primary/85 text-black font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              <PhSignInBold />
              Comenzar Gratis
            </NuxtLink>
            <a
              href="#como-funciona"
              class="inline-flex items-center gap-1 text-gray-300 hover:text-white font-medium transition-colors"
            >
              Ver cómo funciona
              <PhArrowRightBold class="text-sm" />
            </a>
          </div>
        </div>
        <!-- Right: inline SVG dashboard mockup -->
        <div class="md:w-1/2 flex justify-center">
          <svg viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full max-w-md" aria-hidden="true">
            <!-- Outer card -->
            <rect x="6" y="6" width="348" height="268" rx="18" fill="#32353b" stroke="#3f4249" stroke-width="1.5"/>
            <!-- Top bar with branding -->
            <rect x="6" y="6" width="348" height="42" rx="18" fill="#32353b"/>
            <rect x="6" y="30" width="348" height="18" fill="#32353b"/>
            <line x1="6" y1="48" x2="354" y2="48" stroke="#3f4249" stroke-width="1"/>
            <!-- Logo mark: PT -->
            <rect x="20" y="16" width="26" height="22" rx="6" fill="#4DA892"/>
            <text x="33" y="31" text-anchor="middle" fill="#27292D" font-size="12" font-weight="800" font-family="Inter, sans-serif">PT</text>
            <!-- App title -->
            <text x="54" y="31" fill="#ffffff" font-size="11" font-weight="700" font-family="Inter, sans-serif" opacity="0.9">PayTrackr</text>
            <!-- Month nav -->
            <text x="276" y="31" fill="#ffffff" font-size="9" font-weight="500" font-family="Inter, sans-serif" opacity="0.5">Febrero 2026</text>
            <!-- Notification bell -->
            <circle cx="338" cy="27" r="4" fill="#E84A8A"/>
            <text x="338" y="29.5" text-anchor="middle" fill="white" font-size="6" font-weight="700">2</text>

            <!-- Summary strip -->
            <rect x="18" y="58" width="100" height="36" rx="8" fill="#27292D"/>
            <text x="28" y="72" fill="#ffffff" font-size="7" font-weight="500" opacity="0.45">Total Mes</text>
            <text x="28" y="86" fill="#4DA892" font-size="11" font-weight="700">$85.200</text>

            <rect x="128" y="58" width="100" height="36" rx="8" fill="#27292D"/>
            <text x="138" y="72" fill="#ffffff" font-size="7" font-weight="500" opacity="0.45">Pagados</text>
            <text x="138" y="86" fill="#1D9A38" font-size="11" font-weight="700">4 de 7</text>

            <rect x="238" y="58" width="104" height="36" rx="8" fill="#27292D"/>
            <text x="248" y="72" fill="#ffffff" font-size="7" font-weight="500" opacity="0.45">Pendientes</text>
            <text x="248" y="86" fill="#E6AE2C" font-size="11" font-weight="700">$32.800</text>

            <!-- Payment row 1 — Paid -->
            <rect x="18" y="106" width="324" height="36" rx="8" fill="#27292D"/>
            <circle cx="36" cy="124" r="8" fill="#1D9A38" opacity="0.2"/>
            <text x="36" y="127" text-anchor="middle" fill="#1D9A38" font-size="9" font-weight="700">&#10003;</text>
            <text x="52" y="120" fill="#ffffff" font-size="9" font-weight="600" opacity="0.85">Spotify</text>
            <rect x="52" y="126" width="46" height="5" rx="2.5" fill="#4DA892" opacity="0.15"/>
            <text x="55" y="130" fill="#4DA892" font-size="5" font-weight="500">Suscripciones</text>
            <text x="306" y="121" text-anchor="end" fill="#4DA892" font-size="9" font-weight="600">$3.500</text>
            <rect x="312" y="115" width="24" height="14" rx="4" fill="#1D9A38" opacity="0.15"/>
            <text x="324" y="124" text-anchor="middle" fill="#1D9A38" font-size="6" font-weight="600">Pago</text>

            <!-- Payment row 2 — Paid -->
            <rect x="18" y="148" width="324" height="36" rx="8" fill="#27292D"/>
            <circle cx="36" cy="166" r="8" fill="#1D9A38" opacity="0.2"/>
            <text x="36" y="169" text-anchor="middle" fill="#1D9A38" font-size="9" font-weight="700">&#10003;</text>
            <text x="52" y="162" fill="#ffffff" font-size="9" font-weight="600" opacity="0.85">Alquiler</text>
            <rect x="52" y="168" width="34" height="5" rx="2.5" fill="#6158FF" opacity="0.15"/>
            <text x="55" y="172" fill="#6158FF" font-size="5" font-weight="500">Vivienda</text>
            <text x="306" y="163" text-anchor="end" fill="#4DA892" font-size="9" font-weight="600">$45.000</text>
            <rect x="312" y="157" width="24" height="14" rx="4" fill="#1D9A38" opacity="0.15"/>
            <text x="324" y="166" text-anchor="middle" fill="#1D9A38" font-size="6" font-weight="600">Pago</text>

            <!-- Payment row 3 — Pending -->
            <rect x="18" y="190" width="324" height="36" rx="8" fill="#27292D"/>
            <circle cx="36" cy="208" r="8" fill="#E6AE2C" opacity="0.2"/>
            <circle cx="36" cy="208" r="3" fill="#E6AE2C" opacity="0.6"/>
            <text x="52" y="204" fill="#ffffff" font-size="9" font-weight="600" opacity="0.85">Edenor</text>
            <rect x="52" y="210" width="32" height="5" rx="2.5" fill="#E84A8A" opacity="0.15"/>
            <text x="55" y="214" fill="#E84A8A" font-size="5" font-weight="500">Servicios</text>
            <text x="306" y="205" text-anchor="end" fill="#E6AE2C" font-size="9" font-weight="600">$18.300</text>
            <rect x="312" y="199" width="24" height="14" rx="4" fill="#E6AE2C" opacity="0.15"/>
            <text x="324" y="208" text-anchor="middle" fill="#E6AE2C" font-size="6" font-weight="500">Pend.</text>

            <!-- Payment row 4 — Pending -->
            <rect x="18" y="232" width="324" height="36" rx="8" fill="#27292D"/>
            <circle cx="36" cy="250" r="8" fill="#E6AE2C" opacity="0.2"/>
            <circle cx="36" cy="250" r="3" fill="#E6AE2C" opacity="0.6"/>
            <text x="52" y="246" fill="#ffffff" font-size="9" font-weight="600" opacity="0.85">Personal</text>
            <rect x="52" y="252" width="32" height="5" rx="2.5" fill="#E84A8A" opacity="0.15"/>
            <text x="55" y="256" fill="#E84A8A" font-size="5" font-weight="500">Servicios</text>
            <text x="306" y="247" text-anchor="end" fill="#E6AE2C" font-size="9" font-weight="600">$14.500</text>
            <rect x="312" y="241" width="24" height="14" rx="4" fill="#E6AE2C" opacity="0.15"/>
            <text x="324" y="250" text-anchor="middle" fill="#E6AE2C" font-size="6" font-weight="500">Pend.</text>
          </svg>
        </div>
      </div>
    </section>

    <!-- Cómo Funciona -->
    <section id="como-funciona" class="bg-white/[0.03] py-16 w-full">
      <div class="max-w-7xl m-auto px-6">
        <div class="flex flex-col items-center text-center mb-12">
          <h2 class="text-2xl font-bold mb-2">Cómo Funciona</h2>
          <p class="text-gray-400 max-w-lg">Tres pasos y listo. Sin complicaciones.</p>
        </div>
        <div class="relative flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-0 md:justify-between">
          <!-- Connector line (desktop only) -->
          <div class="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary via-secondary to-danger opacity-30" aria-hidden="true"></div>
          <!-- Step 1 -->
          <div class="flex flex-col items-center text-center gap-3 md:flex-1 relative z-10">
            <div class="step-circle step-circle--primary">1</div>
            <h3 class="font-semibold text-lg">Registrá</h3>
            <p class="text-gray-400 text-sm max-w-[200px]">Agregá tus pagos fijos y gastos únicos en segundos.</p>
          </div>
          <!-- Step 2 -->
          <div class="flex flex-col items-center text-center gap-3 md:flex-1 relative z-10">
            <div class="step-circle step-circle--secondary">2</div>
            <h3 class="font-semibold text-lg">Seguí</h3>
            <p class="text-gray-400 text-sm max-w-[200px]">Visualizá el estado de tus pagos y recibí recordatorios.</p>
          </div>
          <!-- Step 3 -->
          <div class="flex flex-col items-center text-center gap-3 md:flex-1 relative z-10">
            <div class="step-circle step-circle--danger">3</div>
            <h3 class="font-semibold text-lg">Analizá</h3>
            <p class="text-gray-400 text-sm max-w-[200px]">Recibí resúmenes semanales con IA sobre tus finanzas.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="py-16 w-full">
      <div class="max-w-7xl m-auto px-6">
        <div class="flex flex-col items-center text-center mb-12">
          <h2 class="text-2xl font-bold mb-2">Características</h2>
          <p class="text-gray-400 max-w-lg">Todo lo que necesitás para controlar tus finanzas personales.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- Feature 1 -->
          <div class="feature-card">
            <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-primary/25 mb-4">
              <LucideCalendarCheck class="text-2xl text-primary" />
            </div>
            <h3 class="font-semibold text-base mb-1.5 text-white">Pagos Fijos y Únicos</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Gestioná suscripciones mensuales y gastos puntuales en un solo lugar.</p>
          </div>
          <!-- Feature 2 -->
          <div class="feature-card">
            <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-secondary/25 mb-4">
              <PhChartBarBold class="text-2xl text-secondary" />
            </div>
            <h3 class="font-semibold text-base mb-1.5 text-white">Resúmenes y Gráficos</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Visualizá a dónde va tu plata con gráficos claros y detallados.</p>
          </div>
          <!-- Feature 3 -->
          <div class="feature-card">
            <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-danger/25 mb-4">
              <MdiCreation class="text-2xl text-danger" />
            </div>
            <h3 class="font-semibold text-base mb-1.5 text-white">Resumen Semanal con IA</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Cada semana recibís un análisis inteligente de tus hábitos de gasto.</p>
          </div>
          <!-- Feature 4 -->
          <div class="feature-card">
            <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-success/25 mb-4">
              <PhWhatsappLogoBold class="text-2xl text-success" />
            </div>
            <h3 class="font-semibold text-base mb-1.5 text-white">Integración con WhatsApp</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Registrá pagos mandando un mensaje de WhatsApp. Así de fácil.</p>
          </div>
          <!-- Feature 5 -->
          <div class="feature-card">
            <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-warning/25 mb-4">
              <LucideBellRing class="text-2xl text-warning" />
            </div>
            <h3 class="font-semibold text-base mb-1.5 text-white">Notificaciones Inteligentes</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Recordatorios automáticos antes de que venza cada pago.</p>
          </div>
          <!-- Feature 6 -->
          <div class="feature-card">
            <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-accent/25 mb-4">
              <PhPaletteBold class="text-2xl text-accent" />
            </div>
            <h3 class="font-semibold text-base mb-1.5 text-white">Categorías Personalizables</h3>
            <p class="text-gray-300 text-sm leading-relaxed">Organizá tus pagos con categorías y colores a tu gusto.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- WhatsApp + AI Standout Section -->
    <section class="bg-white/[0.03] py-16 w-full">
      <div class="max-w-7xl m-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- WhatsApp Card -->
          <div class="standout-card group">
            <div class="flex flex-col sm:flex-row items-start gap-6">
              <!-- Phone SVG -->
              <div class="shrink-0">
                <svg viewBox="0 0 140 220" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-28" aria-hidden="true">
                  <!-- Phone body -->
                  <rect x="4" y="4" width="132" height="212" rx="18" fill="#27292D" stroke="#3f4249" stroke-width="2"/>
                  <!-- Screen -->
                  <rect x="12" y="16" width="116" height="188" rx="10" fill="#32353b"/>
                  <!-- Header bar -->
                  <rect x="12" y="16" width="116" height="32" rx="10" fill="#1D9A38"/>
                  <circle cx="32" cy="32" r="9" fill="#ffffff" opacity="0.3"/>
                  <rect x="48" y="28" width="56" height="7" rx="3.5" fill="#ffffff" opacity="0.5"/>
                  <!-- Chat bubble received -->
                  <rect x="22" y="60" width="80" height="26" rx="10" fill="#3f4249"/>
                  <rect x="30" y="68" width="52" height="5" rx="2.5" fill="#ffffff" opacity="0.3"/>
                  <rect x="30" y="76" width="36" height="4" rx="2" fill="#ffffff" opacity="0.15"/>
                  <!-- Chat bubble sent -->
                  <rect x="46" y="96" width="82" height="26" rx="10" fill="#4DA892" opacity="0.85"/>
                  <rect x="54" y="104" width="60" height="5" rx="2.5" fill="#ffffff" opacity="0.5"/>
                  <rect x="54" y="112" width="40" height="4" rx="2" fill="#ffffff" opacity="0.25"/>
                  <!-- Chat bubble received 2 -->
                  <rect x="22" y="132" width="72" height="26" rx="10" fill="#3f4249"/>
                  <rect x="30" y="140" width="48" height="5" rx="2.5" fill="#ffffff" opacity="0.3"/>
                  <rect x="30" y="148" width="30" height="4" rx="2" fill="#ffffff" opacity="0.15"/>
                  <!-- Input bar -->
                  <rect x="18" y="176" width="104" height="22" rx="11" fill="#27292D" stroke="#3f4249" stroke-width="1"/>
                  <rect x="28" y="184" width="50" height="5" rx="2.5" fill="#ffffff" opacity="0.12"/>
                </svg>
              </div>
              <!-- Copy -->
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2 text-success">
                  <PhWhatsappLogoBold class="text-2xl" />
                  <h3 class="font-bold text-lg text-white">WhatsApp Bot</h3>
                </div>
                <p class="text-gray-400 leading-relaxed">
                  Mandá un mensaje a nuestro bot y registrá un pago al instante. Sin abrir la app, sin formularios. Solo escribí lo que pagaste.
                </p>
                <span class="text-success text-sm font-medium">Disponible en el plan Premium</span>
              </div>
            </div>
          </div>
          <!-- AI Card -->
          <div class="standout-card group">
            <div class="flex flex-col sm:flex-row items-start gap-6">
              <!-- AI Chart SVG -->
              <div class="shrink-0">
                <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-28" aria-hidden="true">
                  <!-- Background -->
                  <rect x="4" y="4" width="132" height="132" rx="16" fill="#27292D" stroke="#3f4249" stroke-width="1.5"/>
                  <!-- Grid lines -->
                  <line x1="24" y1="108" x2="120" y2="108" stroke="#3f4249" stroke-width="1"/>
                  <line x1="24" y1="84" x2="120" y2="84" stroke="#3f4249" stroke-width="0.5" opacity="0.4"/>
                  <line x1="24" y1="60" x2="120" y2="60" stroke="#3f4249" stroke-width="0.5" opacity="0.4"/>
                  <line x1="24" y1="36" x2="120" y2="36" stroke="#3f4249" stroke-width="0.5" opacity="0.4"/>
                  <!-- Area fill -->
                  <path d="M32 88 L56 68 L80 76 L104 44 L116 52 L116 108 L32 108 Z" fill="#6158FF" opacity="0.12"/>
                  <!-- Line chart -->
                  <polyline points="32,88 56,68 80,76 104,44 116,52" stroke="#6158FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  <!-- Data points -->
                  <circle cx="32" cy="88" r="4" fill="#6158FF"/>
                  <circle cx="56" cy="68" r="4" fill="#6158FF"/>
                  <circle cx="80" cy="76" r="4" fill="#6158FF"/>
                  <circle cx="104" cy="44" r="4" fill="#6158FF"/>
                  <circle cx="116" cy="52" r="4" fill="#6158FF"/>
                  <!-- Sparkle stars -->
                  <path d="M98 24 L100 28 L104 26 L100 30 L98 34 L96 30 L92 26 L96 28 Z" fill="#6158FF" opacity="0.8"/>
                  <path d="M42 28 L43 31 L46 30 L43 32 L42 35 L41 32 L38 30 L41 31 Z" fill="#4DA892" opacity="0.7"/>
                  <path d="M118 72 L119 74 L121 73 L119 75 L118 77 L117 75 L115 73 L117 74 Z" fill="#4DA892" opacity="0.6"/>
                </svg>
              </div>
              <!-- Copy -->
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2 text-secondary">
                  <MdiCreation class="text-2xl" />
                  <h3 class="font-bold text-lg text-white">Análisis con IA</h3>
                </div>
                <p class="text-gray-400 leading-relaxed">
                  Cada semana recibís un resumen inteligente que analiza tus gastos, detecta patrones y te da recomendaciones concretas.
                </p>
                <span class="text-secondary text-sm font-medium">Incluido con Premium</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="py-16 w-full">
      <div class="max-w-7xl m-auto px-6">
        <div class="flex flex-col items-center text-center mb-12">
          <h2 class="text-2xl font-bold mb-2">Precios</h2>
          <p class="text-gray-400 max-w-lg">Elegí el plan que mejor se adapte a tus necesidades.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl m-auto">
          <!-- Free Tier -->
          <div class="pricing-card">
            <span class="text-lg font-semibold tracking-wide">Gratis</span>
            <div class="flex items-end gap-1 mt-4 mb-6">
              <span class="text-3xl font-bold tracking-tight">$0</span>
              <span class="text-gray-400 font-medium pb-0.5">/ mes</span>
            </div>
            <ul class="flex flex-col gap-3 text-sm text-gray-300 mb-8">
              <li class="flex items-start gap-2">
                <span class="text-primary mt-0.5">&#10003;</span>
                Hasta 20 pagos fijos
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-0.5">&#10003;</span>
                Pagos únicos ilimitados
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-0.5">&#10003;</span>
                Resúmenes y gráficos básicos
              </li>
              <li class="flex items-start gap-2">
                <span class="text-primary mt-0.5">&#10003;</span>
                Categorías personalizables
              </li>
            </ul>
            <NuxtLink
              to="/welcome?redirect=/"
              class="inline-flex items-center justify-center gap-2 w-full bg-surface hover:bg-surface-hover border border-surface text-white rounded-lg py-2.5 font-medium transition-colors"
            >
              <PhSignInBold />
              Registrarse Gratis
            </NuxtLink>
          </div>
          <!-- Premium Tier -->
          <div class="pricing-card pricing-card--premium">
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold tracking-wide">Premium</span>
              <span class="bg-secondary/20 text-secondary text-xs font-bold px-2.5 py-0.5 rounded-full tracking-wide">RECOMENDADO</span>
            </div>
            <div class="flex items-end gap-1 mt-4 mb-6">
              <span class="text-3xl font-bold tracking-tight">$3.000</span>
              <span class="text-gray-400 font-medium pb-0.5">/ mes</span>
            </div>
            <ul class="flex flex-col gap-3 text-sm text-gray-300 mb-8">
              <li class="flex items-start gap-2">
                <span class="text-secondary mt-0.5">&#10003;</span>
                Pagos fijos ilimitados
              </li>
              <li class="flex items-start gap-2">
                <span class="text-secondary mt-0.5">&#10003;</span>
                Resumen semanal con IA
              </li>
              <li class="flex items-start gap-2">
                <span class="text-secondary mt-0.5">&#10003;</span>
                Integración WhatsApp Bot
              </li>
              <li class="flex items-start gap-2">
                <span class="text-secondary mt-0.5">&#10003;</span>
                Notificaciones inteligentes
              </li>
              <li class="flex items-start gap-2">
                <span class="text-secondary mt-0.5">&#10003;</span>
                Exportación de datos
              </li>
              <li class="flex items-start gap-2">
                <span class="text-secondary mt-0.5">&#10003;</span>
                Soporte prioritario
              </li>
            </ul>
            <NuxtLink
              to="/welcome?redirect=/"
              class="inline-flex items-center justify-center gap-2 w-full bg-secondary hover:bg-secondary/85 text-white rounded-lg py-2.5 font-medium transition-colors"
            >
              <LetsIconsDimondAlt />
              Obtener Premium
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="bg-white/[0.03] py-16 w-full">
      <div class="max-w-7xl m-auto px-6 flex flex-col items-center text-center gap-6">
        <h2 class="text-2xl md:text-3xl font-bold">Tomá el Control de tus Finanzas</h2>
        <p class="text-gray-400 max-w-lg">
          Unite a PayTrackr y empezá a gestionar tus pagos de forma inteligente. Es gratis.
        </p>
        <div class="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <NuxtLink
            to="/welcome?redirect=/"
            class="inline-flex items-center gap-2 bg-primary hover:bg-primary/85 text-black font-semibold rounded-lg px-6 py-2.5 transition-colors"
          >
            <PhSignInBold />
            Comenzar Gratis
          </NuxtLink>
          <NuxtLink
            to="/faq"
            class="text-gray-300 hover:text-white font-medium transition-colors"
          >
            Preguntas Frecuentes
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import PhSignInBold from "~icons/ph/sign-in-bold";
import PhArrowRightBold from "~icons/ph/arrow-right-bold";
import PhChartBarBold from "~icons/ph/chart-bar-bold";
import PhWhatsappLogoBold from "~icons/ph/whatsapp-logo-bold";
import PhPaletteBold from "~icons/ph/palette-bold";
import LucideCalendarCheck from "~icons/lucide/calendar-check";
import LucideBellRing from "~icons/lucide/bell-ring";
import MdiCreation from "~icons/mdi/creation";
import LetsIconsDimondAlt from "~icons/lets-icons/dimond-alt";
import { getCurrentUserAsync } from '~/utils/firebase';

const user = import.meta.server ? null : await getCurrentUserAsync();
const route = useRoute();

onMounted(() => {
  if (user && route.path === "/" && !route.query.showLanding) {
    navigateTo("/fijos");
  }
});

definePageMeta({
  layout: "landing"
});

useSeo({
  title: 'Finanzas Personales Sin Esfuerzo: Simplificá el Seguimiento de tus Pagos',
  description: 'Simplificá tu gestión financiera con PayTrackr. Seguí tus pagos mensuales, registrá gastos por WhatsApp y recibí notificaciones inteligentes con análisis de IA. ¡Empezá gratis hoy!',
  path: '/',
});
</script>

<style scoped>
.hero-title {
  font-size: 2.5rem;
  line-height: 1.15;
  font-weight: 800;
  text-align: left;
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 3.25rem;
  }
}

.step-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  background-color: #27292D;
  border: 2px solid;
}

.step-circle--primary {
  color: #4DA892;
  border-color: rgba(77, 168, 146, 0.4);
  box-shadow: 0 0 12px rgba(77, 168, 146, 0.1);
}

.step-circle--secondary {
  color: #6158FF;
  border-color: rgba(97, 88, 255, 0.4);
  box-shadow: 0 0 12px rgba(97, 88, 255, 0.1);
}

.step-circle--danger {
  color: #E84A8A;
  border-color: rgba(232, 74, 138, 0.4);
  box-shadow: 0 0 12px rgba(232, 74, 138, 0.1);
}

.feature-card {
  background-color: #32353b;
  border: 1px solid #3f4249;
  border-radius: 1rem;
  padding: 1.5rem;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: rgba(77, 168, 146, 0.3);
  box-shadow: 0 8px 24px rgba(77, 168, 146, 0.08);
}

.standout-card {
  background-color: #32353b;
  border: 1px solid #3f4249;
  border-radius: 1.25rem;
  padding: 2rem;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.standout-card:hover {
  transform: translateY(-4px);
  border-color: rgba(97, 88, 255, 0.3);
  box-shadow: 0 8px 24px rgba(97, 88, 255, 0.08);
}

.pricing-card {
  background-color: #32353b;
  border: 1px solid #3f4249;
  border-radius: 1.25rem;
  padding: 2rem;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.pricing-card:hover {
  transform: translateY(-4px);
  border-color: rgba(77, 168, 146, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.pricing-card--premium {
  border-color: rgba(97, 88, 255, 0.35);
  box-shadow: 0 0 24px rgba(97, 88, 255, 0.08);
}

.pricing-card--premium:hover {
  border-color: rgba(97, 88, 255, 0.55);
  box-shadow: 0 8px 32px rgba(97, 88, 255, 0.15);
}
</style>
