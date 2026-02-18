<template>
  <section class="w-full py-12 lg:py-20">
    <div class="max-w-3xl m-auto px-6">
      <div class="mb-10">
        <h1 class="faq-title">Preguntas Frecuentes</h1>
        <p class="text-gray-400 mt-3 text-lg leading-relaxed">
          Si tenés alguna otra pregunta, escribinos desde la página de
          <NuxtLink to="contact-us" class="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors">Contacto</NuxtLink>
          (necesitás haber iniciado sesión).
        </p>
      </div>
      <div class="flex flex-col gap-3">
        <details v-for="(item, i) in faqs" :key="i" class="faq-item group">
          <summary class="faq-summary">
            <span>{{ item.q }}</span>
            <svg class="w-5 h-5 shrink-0 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </summary>
          <div class="faq-answer" v-html="item.a"></div>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: "landing"
});

const faqs = [
  {
    q: "¿Por qué necesito crear una cuenta?",
    a: "Usamos tu cuenta de Google para asignarte un identificador único y poder guardar tus pagos de forma segura. No almacenamos contraseñas."
  },
  {
    q: "¿Cuánto cuesta usar PayTrackr?",
    a: "Tenemos un plan <strong>Gratis</strong> que incluye hasta 20 pagos fijos, pagos únicos ilimitados y resúmenes básicos. El plan <strong>Premium</strong> cuesta <strong>$3.000/mes</strong> e incluye pagos ilimitados, resumen semanal con IA, integración con WhatsApp, notificaciones inteligentes y más."
  },
  {
    q: "¿Cómo funciona la integración con WhatsApp?",
    a: "Con el plan Premium podés enviar un mensaje a nuestro bot de WhatsApp describiendo el pago (por ejemplo: <em>\"Pagué $5.000 de luz\"</em>) y se registra automáticamente en tu cuenta. No necesitás abrir la app."
  },
  {
    q: "¿Qué es el resumen semanal con IA?",
    a: "Cada semana generamos un análisis automático de tus gastos usando inteligencia artificial. Te mostramos patrones de gasto, comparaciones con semanas anteriores y recomendaciones personalizadas para mejorar tus finanzas."
  },
  {
    q: "¿Por qué no se actualizan los pagos que ya marqué como pagados?",
    a: "Cuando marcás un pago como pagado, lo consideramos una transacción histórica. Si necesitás modificarlo, primero desmarcalo como pagado, hacé los cambios y volvé a marcarlo."
  },
  {
    q: "¿Puedo usar PayTrackr desde el celular?",
    a: "Sí. PayTrackr es una Progressive Web App (PWA). Podés instalarla en tu celular desde el navegador y usarla como una app nativa, con acceso offline y notificaciones push."
  },
  {
    q: "¿Mis datos financieros están seguros?",
    a: "Sí. Usamos Firebase de Google para la autenticación y almacenamiento de datos. Toda la comunicación está cifrada y tus datos son privados — solo vos podés verlos."
  },
  {
    q: "¿Puedo categorizar mis pagos?",
    a: "Sí. Podés usar las categorías predeterminadas (Vivienda, Servicios, Supermercado, Entretenimiento, etc.) o crear las tuyas propias con colores personalizados desde la sección de Configuración."
  },
  {
    q: "¿Qué tipo de notificaciones recibo?",
    a: "Con el plan Premium recibís notificaciones push antes de que venzan tus pagos. Podés configurar con cuántos días de anticipación querés recibir el recordatorio desde la sección de Configuración."
  },
  {
    q: "¿Puedo cancelar el plan Premium en cualquier momento?",
    a: "Sí, podés cancelar en cualquier momento. Al cancelar, tu cuenta vuelve al plan Gratis y mantenés acceso a tus datos."
  },
];

useSeo({
  title: 'Preguntas Frecuentes - PayTrackr',
  description: 'Respuestas a las preguntas más comunes sobre PayTrackr: precios, funcionalidades, seguridad, integración con WhatsApp y más.',
  path: '/faq',
});
</script>

<style scoped>
.faq-title {
  font-size: 2rem;
  font-weight: 800;
  text-align: left;
}

.faq-item {
  background-color: #32353b;
  border: 1px solid #3f4249;
  border-radius: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.faq-item[open] {
  border-color: rgba(77, 168, 146, 0.3);
}

.faq-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  list-style: none;
  user-select: none;
}

.faq-summary::-webkit-details-marker {
  display: none;
}

.faq-summary::marker {
  display: none;
  content: '';
}

.faq-answer {
  padding: 0 1.25rem 1.25rem;
  color: #9ca3af;
  font-size: 0.9rem;
  line-height: 1.7;
}

.faq-answer strong {
  color: #ffffff;
  font-weight: 600;
}

.faq-answer em {
  color: #d1d5db;
}
</style>
