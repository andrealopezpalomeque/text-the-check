<template>
  <section id="modes" class="relative pt-16 md:pt-20 pb-20 px-4 overflow-hidden">
    <!-- Subtle background glow -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-ttc-primary/[0.03] rounded-full blur-[100px]" />
    </div>

    <div class="relative max-w-5xl mx-auto">
      <!-- Section label -->
      <p class="font-body font-semibold text-[11px] tracking-[2px] uppercase text-ttc-primary text-center mb-3">
        un chat, cero complicaciones
      </p>

      <!-- Section title -->
      <h2 class="font-nunito font-extrabold text-2xl sm:text-3xl text-ttc-text text-center mb-3">
        Todo registrado, todo al día — desde un mensaje
      </h2>

      <!-- Subtitle -->
      <p class="font-body text-[15px] text-ttc-text-muted text-center mb-10 max-w-[520px] mx-auto">
        Mandá un mensaje como "50 cena con Gonza" y listo. Se calcula solo quién debe a quién.
      </p>

      <!-- Two columns: features + chat -->
      <div class="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
        <!-- Left column: Feature card -->
        <div class="bg-ttc-card border border-[#4A90D9]/40 ring-1 ring-[#4A90D9]/20 rounded-xl overflow-hidden">
          <div class="h-[3px] bg-[#4A90D9]" />
          <div class="p-6">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center bg-ttc-toggle-primary text-ttc-primary">
                <Plane :size="20" :stroke-width="1.5" />
              </div>
              <span class="font-body font-semibold text-[11px] tracking-[1px] uppercase text-ttc-primary">
                Dividí gastos con amigos
              </span>
            </div>
            <h3 class="font-nunito font-bold text-xl text-ttc-text mb-3">
              Viajes y Grupos
            </h3>
            <p class="font-body text-sm text-ttc-text-muted leading-relaxed mb-5">
              Mandá un mensaje como "50 cena con Gonza" y listo. Se calcula solo quién debe a quién. Cuando termina el viaje, todos saben cuánto poner.
            </p>
            <ul class="space-y-3">
              <li
                v-for="(feature, i) in features"
                :key="i"
                class="flex items-start gap-3 font-body text-sm leading-relaxed text-ttc-text-muted"
              >
                <div class="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-ttc-toggle-primary text-ttc-primary">
                  <component :is="feature.icon" :size="16" :stroke-width="1.5" />
                </div>
                <span class="pt-1">{{ feature.text }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right column: Chat preview -->
        <div class="sticky top-20">
          <ChatPreview />
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-14 text-center">
        <a
          :href="whatsappUrl"
          target="_blank"
          class="inline-flex items-center gap-2 bg-[#25D366] text-white rounded-xl px-8 py-3.5 font-body text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Empezar por WhatsApp
          <MessageCircle :size="16" :stroke-width="2" />
        </a>
        <p class="mt-3 font-body text-xs text-ttc-text-dim">
          O <a href="/iniciar-sesion" class="underline hover:text-ttc-text transition-colors">iniciá sesión con Google</a>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Plane, MessageSquareText, ArrowLeftRight, DollarSign, MessageCircle } from 'lucide-vue-next'

const config = useRuntimeConfig()
const whatsappPhone = config.public.whatsappPhoneNumber
const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=Hola` : '/iniciar-sesion'

const features = [
  { icon: MessageSquareText, text: 'Escribí como hablás — te entiende perfecto' },
  { icon: ArrowLeftRight, text: 'Sabe quién debe a quién, siempre actualizado' },
  { icon: DollarSign, text: 'Pesos, dólares o reales — vos elegís' },
]
</script>
