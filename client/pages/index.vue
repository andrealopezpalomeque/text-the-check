<template>
  <div>
    <!-- Auth-check overlay -->
    <Transition name="fade">
      <div
        v-if="isCheckingAuth"
        class="fixed inset-0 z-[60] bg-ttc-bg flex flex-col items-center justify-center gap-4"
      >
        <AppLogo variant="stacked" />
        <div class="flex items-center gap-2 text-ttc-text-muted text-sm font-body">
          <span class="w-4 h-4 border-2 border-ttc-primary/30 border-t-ttc-primary rounded-full animate-spin" />
          Verificando sesión...
        </div>
      </div>
    </Transition>

    <!-- HERO -->
    <div class="pt-16 md:pt-[84px] pb-16 md:pb-20 px-5 max-w-[960px] mx-auto">
      <div class="flex flex-col lg:flex-row lg:items-center lg:gap-16">
        <!-- Left column: text + CTAs -->
        <div class="text-center lg:text-left lg:flex-1">
          <div class="font-body font-medium text-[10px] tracking-[3px] uppercase text-ttc-primary-light mb-5">
            Your money, one message away
          </div>

          <h1 class="font-nunito font-extrabold text-[clamp(28px,6vw,44px)] leading-[1.15] text-ttc-text mb-5">
            Dividí gastos en grupo.<br />
            <em class="not-italic text-ttc-primary">Sin planillas. Sin discusiones.</em>
          </h1>

          <p class="text-base text-ttc-text-muted max-w-[520px] mx-auto lg:mx-0 mb-9 leading-relaxed">
            Un asado, un viaje, el alquiler compartido — mandale un mensaje al bot de WhatsApp
            con lo que gastaste y listo. La IA entiende tu mensaje, registra el gasto, y todos saben cuánto deben.
          </p>

          <!-- CTA buttons -->
          <div class="flex gap-3.5 justify-center lg:justify-start flex-wrap flex-col items-center sm:flex-row sm:items-stretch">
            <button
              @click="handleSignIn"
              class="inline-flex items-center gap-2 font-body font-semibold text-sm text-white bg-ttc-primary px-6 py-3 rounded-lg hover:opacity-90 transition-opacity w-full sm:w-auto justify-center max-w-[300px]"
            >
              <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Iniciar sesión
            </button>
            <a
              :href="whatsappLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 font-body font-semibold text-sm text-white bg-ttc-whatsapp px-6 py-3 rounded-lg hover:brightness-110 transition-all w-full sm:w-auto justify-center max-w-[300px]"
            >
              <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Escribile al bot
            </a>
          </div>
        </div>

        <!-- Right column: animated WhatsApp demo -->
        <div class="mt-10 lg:mt-0 lg:flex-shrink-0 flex justify-center">
          <WhatsAppHeroDemo />
        </div>
      </div>
    </div>

    <!-- HOW IT WORKS -->
    <section class="py-16 md:py-20 px-5 max-w-[900px] mx-auto">
      <div class="font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-primary mb-3">
        Cómo funciona
      </div>
      <h2 class="font-nunito font-extrabold text-[clamp(22px,4vw,30px)] text-ttc-text mb-12">
        Tres pasos. Cero fricción.
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Step 1 -->
        <div class="bg-ttc-card border border-ttc-border rounded-card p-5 relative">
          <div class="font-nunito font-extrabold text-[32px] text-ttc-primary opacity-30 absolute top-4 right-5 leading-none">01</div>
          <div class="w-10 h-10 rounded-[10px] bg-ttc-primary/10 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-ttc-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">Mandá un mensaje</h3>
          <p class="text-[13px] text-ttc-text-muted leading-relaxed">Escribile al bot por WhatsApp lo que gastaste. Texto, audio o foto del ticket — todo vale.</p>
          <div class="mt-3 font-dm-mono text-xs text-ttc-primary-light bg-ttc-primary/10 px-3 py-2 rounded-lg border border-ttc-primary/[0.18]">
            "pagué 8 lucas de la birra"
          </div>
        </div>

        <!-- Step 2 -->
        <div class="bg-ttc-card border border-ttc-border rounded-card p-5 relative">
          <div class="font-nunito font-extrabold text-[32px] text-ttc-primary opacity-30 absolute top-4 right-5 leading-none">02</div>
          <div class="w-10 h-10 rounded-[10px] bg-ttc-primary/10 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-ttc-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">La IA lo entiende</h3>
          <p class="text-[13px] text-ttc-text-muted leading-relaxed">Entiende lunfardo, montos en lucas, @menciones y hasta fotos de tickets. Te confirma antes de guardar.</p>
          <div class="mt-3 font-dm-mono text-xs text-ttc-primary-light bg-ttc-primary/10 px-3 py-2 rounded-lg border border-ttc-primary/[0.18]">
            Gasto: $8.000 — Birra. ¿Correcto?
          </div>
        </div>

        <!-- Step 3 -->
        <div class="bg-ttc-card border border-ttc-border rounded-card p-5 relative">
          <div class="font-nunito font-extrabold text-[32px] text-ttc-primary opacity-30 absolute top-4 right-5 leading-none">03</div>
          <div class="w-10 h-10 rounded-[10px] bg-ttc-primary/10 flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-ttc-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3 class="font-nunito font-bold text-base text-ttc-text mb-2">Todos saben cuánto deben</h3>
          <p class="text-[13px] text-ttc-text-muted leading-relaxed">Balances automáticos. Cada uno ve cuánto debe o cuánto le deben. Chau discusiones.</p>
          <div class="mt-3 font-dm-mono text-xs text-ttc-primary-light bg-ttc-primary/10 px-3 py-2 rounded-lg border border-ttc-primary/[0.18]">
            /balance → "Gonza te debe $4.000"
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="py-16 md:py-20 px-5 max-w-[900px] mx-auto">
      <div class="font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-primary mb-3">
        Hecho para vos
      </div>
      <h2 class="font-nunito font-extrabold text-[clamp(22px,4vw,30px)] text-ttc-text mb-12">
        Todo lo que necesitas, nada que te sobre.
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="feature in features" :key="feature.title" class="bg-ttc-card border border-ttc-border rounded-card p-5">
          <div class="text-2xl mb-3 leading-none" v-html="feature.icon" />
          <h3 class="font-nunito font-bold text-[15px] text-ttc-text mb-1.5">{{ feature.title }}</h3>
          <p class="text-[13px] text-ttc-text-muted leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>

      <!-- BALANCE PREVIEW -->
      <div class="mt-20 bg-ttc-primary/10 border border-ttc-primary/[0.18] rounded-2xl p-7 max-w-[420px] mx-auto">
        <div class="text-[11px] font-medium text-ttc-text-muted uppercase tracking-[1px] mb-1">Balance del grupo</div>
        <div class="font-nunito font-extrabold text-xl text-ttc-text mb-5">Brasil 2026</div>

        <div v-for="(row, i) in balanceRows" :key="row.name"
          class="flex justify-between items-center py-2.5"
          :class="{ 'border-b border-ttc-border': i < balanceRows.length - 1 }"
        >
          <span class="text-sm font-medium text-ttc-text">{{ row.name }}</span>
          <span class="font-nunito font-bold text-base" :class="row.colorClass">{{ row.amount }}</span>
        </div>
      </div>
    </section>

    <!-- FINAL CTA -->
    <div class="text-center py-20 md:py-20 pb-24 px-5 max-w-[600px] mx-auto">
      <h2 class="font-nunito font-extrabold text-[clamp(22px,4vw,30px)] text-ttc-text mb-4">
        Empezá a dividir gastos con un mensaje.
      </h2>
      <p class="text-ttc-text-muted text-[15px] mb-8">
        Gratis. Sin tarjeta. Vinculá tu WhatsApp y organizá los gastos del grupo en 30 segundos.
      </p>

      <div class="flex gap-3.5 justify-center flex-wrap flex-col items-center sm:flex-row">
        <button
          @click="handleSignIn"
          class="inline-flex items-center gap-2 font-body font-semibold text-sm text-white bg-ttc-primary px-6 py-3 rounded-lg hover:opacity-90 transition-opacity w-full sm:w-auto justify-center max-w-[300px]"
        >
          <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Crear cuenta gratis
        </button>
        <a
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 font-body font-semibold text-sm text-white bg-ttc-whatsapp px-6 py-3 rounded-lg hover:brightness-110 transition-all w-full sm:w-auto justify-center max-w-[300px]"
        >
          <svg class="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Escribile al bot
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'landing'
})

const { isAuthenticated, loading: authLoading, signInWithGoogle } = useAuth()
const router = useRouter()
const config = useRuntimeConfig()
const isCheckingAuth = ref(true)

const whatsappPhone = config.public.whatsappPhoneNumber || '5491100000000'
const whatsappLink = computed(() => `https://wa.me/${whatsappPhone}?text=HOLA`)

const features = [
  {
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>',
    title: 'Español argentino nativo',
    description: 'Entiende "lucas", "mangos", "birra", "bondi", "morfi". No es un traductor — es un bot que habla como vos.',
  },
  {
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    title: 'Multi-moneda',
    description: 'Pesos, dólares, euros, reales. Cotización blue en tiempo real. Ideal para viajes al exterior.',
  },
  {
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    title: 'Grupos inteligentes',
    description: 'Creá un grupo para un viaje, un depto compartido o la juntada del sábado. Agregá amigos por @mención y listo.',
  },
  {
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    title: 'Fotos y audios',
    description: 'Mandá la foto del ticket o un audio diciendo lo que gastaste. La IA extrae el monto y la descripción.',
  },
  {
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    title: 'Confirmación antes de guardar',
    description: 'El bot siempre te muestra lo que entendió y te pide OK antes de registrar. Nunca guarda sin tu aprobación.',
  },
  {
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    title: 'Dashboard web',
    description: 'Todo lo que registrás por WhatsApp aparece en textthecheck.app. Gráficos, historial, reportes y más.',
  },
]

const balanceRows = [
  { name: 'Vos', amount: '+$12.400', colorClass: 'text-ttc-accent' },
  { name: 'Gonza', amount: '-$6.200', colorClass: 'text-ttc-danger' },
  { name: 'Mati', amount: '-$4.800', colorClass: 'text-ttc-danger' },
  { name: 'Sofi', amount: '-$1.400', colorClass: 'text-ttc-danger' },
]

async function handleSignIn() {
  try {
    await signInWithGoogle()
    router.push('/grupos')
  } catch {
    navigateTo('/iniciar-sesion')
  }
}

const resolveAuth = () => {
  if (isAuthenticated.value) {
    navigateTo('/grupos', { replace: true })
  } else {
    isCheckingAuth.value = false
  }
}

onMounted(() => {
  if (!authLoading.value) {
    resolveAuth()
  }
})

watch(authLoading, (loading) => {
  if (!loading) {
    resolveAuth()
  }
})
</script>

<style scoped>
/* Auth overlay transition */
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-leave-to { opacity: 0; }
</style>
