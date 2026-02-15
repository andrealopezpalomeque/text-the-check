<template>
  <div class="bg-ttc-card border border-ttc-border rounded-2xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-3 border-b border-ttc-border px-5 py-3.5">
      <div
        :class="[
          'w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-300',
          activeMode === 'viajes' ? 'bg-ttc-primary/15' : 'bg-ttc-accent/15'
        ]"
      >
        <MessageSquareText
          :size="16"
          :stroke-width="1.5"
          :class="[
            'transition-colors duration-300',
            activeMode === 'viajes' ? 'text-ttc-primary' : 'text-ttc-accent'
          ]"
        />
      </div>
      <div>
        <p class="font-nunito text-sm font-bold text-ttc-text">Text the Check</p>
        <p class="font-body text-[11px] text-ttc-text-muted">en línea</p>
      </div>
    </div>

    <!-- Messages -->
    <div class="p-5">
      <div class="flex flex-col gap-3">
        <div
          v-for="(msg, i) in messages"
          :key="activeMode + '-' + i"
          :class="[
            'flex',
            msg.sender === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            :class="[
              'max-w-[85%] rounded-2xl px-4 py-3',
              msg.sender === 'user'
                ? activeMode === 'viajes'
                  ? 'bg-ttc-bubble-user-primary'
                  : 'bg-ttc-bubble-user-accent'
                : 'bg-ttc-bubble-bot'
            ]"
          >
            <p class="font-body text-sm leading-relaxed text-ttc-text">{{ msg.text }}</p>
            <p class="font-body text-[10px] text-ttc-text-muted text-right mt-1">{{ msg.time }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Input area (decorative) -->
    <div class="border-t border-ttc-border px-5 py-3">
      <div class="flex items-center gap-3 rounded-xl border border-ttc-border bg-ttc-bg px-4 py-2.5">
        <span class="flex-1 font-body text-sm text-ttc-text-dim">Escribí un mensaje...</span>
        <div
          :class="[
            'w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300',
            activeMode === 'viajes' ? 'bg-ttc-primary' : 'bg-ttc-accent'
          ]"
        >
          <ArrowRight :size="14" :stroke-width="2" class="text-ttc-bg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { MessageSquareText, ArrowRight } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  activeMode: {
    type: String,
    required: true,
  },
})

const chatData = {
  viajes: [
    { sender: 'user', text: 'Pagué 12.000 la cena para todos', time: '21:32' },
    { sender: 'bot', text: 'Listo, gasto registrado \u2714 Gonza, Mili y Sofi te deben $3.000 c/u.', time: '21:32' },
    { sender: 'user', text: 'Cuánto me deben en total?', time: '21:33' },
    { sender: 'bot', text: 'Te deben $14.500 en total. Gonza: $6.500, Mili: $4.000, Sofi: $4.000.', time: '21:33' },
  ],
  finanzas: [
    { sender: 'user', text: 'Gasté 2.500 en el súper', time: '18:15' },
    { sender: 'bot', text: 'Registrado en Supermercado \u2714 Llevás $18.200 esta semana.', time: '18:15' },
    { sender: 'user', text: 'Cómo vengo este mes?', time: '18:16' },
    { sender: 'bot', text: 'Llevás $85.400 de $120.000. Vas bien, te quedan 12 días.', time: '18:16' },
  ],
}

const messages = computed(() => chatData[props.activeMode])
</script>
