<template>
  <div class="min-h-screen bg-ttc-bg">
    <div class="container mx-auto px-4 py-12 max-w-3xl">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-ttc-text-muted hover:text-ttc-text transition-colors mb-8"
      >
        <ArrowLeft :size="20" :stroke-width="1.5" />
        Volver al inicio
      </NuxtLink>

      <article class="prose prose-gray max-w-none">
        <h1 class="font-display text-3xl font-bold text-ttc-text mb-2">Política de Privacidad</h1>
        <p class="text-ttc-text-dim text-sm mb-8">Última actualización: 19 de febrero de 2026</p>

        <section class="space-y-6 text-ttc-text-muted leading-relaxed">
          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">1. Responsables</h2>
            <p>
              <strong class="text-ttc-text">text the check</strong> es operado por Imanol Ariel Corimayo y Andrea Lopez Palomeque
              (en adelante, "nosotros"). Para cualquier consulta sobre esta política o el tratamiento de tus datos,
              podés escribirnos a <a href="mailto:hello@textthecheck.app" class="text-ttc-primary hover:text-ttc-primary/80">hello@textthecheck.app</a>.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">2. Qué datos recopilamos</h2>
            <p>Cuando usás text the check, recopilamos y almacenamos:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li><strong class="text-ttc-text">Datos de cuenta:</strong> nombre, dirección de email y foto de perfil proporcionados por Google al iniciar sesión.</li>
              <li><strong class="text-ttc-text">Número de teléfono de WhatsApp:</strong> cuando vinculás tu cuenta mediante el flujo VINCULAR.</li>
              <li><strong class="text-ttc-text">Datos financieros que vos registrás:</strong> gastos, pagos, categorías, gastos recurrentes y balances de grupo.</li>
              <li><strong class="text-ttc-text">Mensajes de WhatsApp:</strong> el contenido de los mensajes que nos enviás (texto, audio, imágenes y PDFs de comprobantes) para procesarlos y registrar tus gastos.</li>
              <li><strong class="text-ttc-text">Información de pago:</strong> CBU/CVU y alias bancario, si decidís cargarlos en tu perfil.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">3. Cómo usamos tus datos</h2>
            <p>Utilizamos tus datos exclusivamente para:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li>Registrar y mostrar tus gastos personales y grupales.</li>
              <li>Procesar los mensajes que enviás por WhatsApp (texto, audio, imágenes, PDFs) para extraer información de gastos.</li>
              <li>Generar resúmenes y análisis de tus finanzas.</li>
              <li>Facilitar la división de gastos entre miembros de un grupo.</li>
              <li>Enviar notificaciones de recordatorio de pagos.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">4. Servicios de terceros</h2>
            <p>text the check utiliza los siguientes servicios de terceros para funcionar:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li><strong class="text-ttc-text">Google Firebase:</strong> autenticación, base de datos (Firestore) y alojamiento. Tus datos se almacenan en los servidores de Google.</li>
              <li><strong class="text-ttc-text">WhatsApp Business API (Meta):</strong> para recibir y enviar mensajes. Meta procesa los mensajes según su propia política de privacidad.</li>
              <li><strong class="text-ttc-text">Google Gemini AI:</strong> para procesar audio, imágenes y PDFs de comprobantes. El contenido se envía a los servidores de Google para su análisis y no se almacena por Google más allá del procesamiento.</li>
              <li><strong class="text-ttc-text">Sentry:</strong> para monitoreo de errores. Se envían datos técnicos (no financieros) para diagnosticar problemas.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">5. Almacenamiento y seguridad</h2>
            <p>
              Tus datos se almacenan en Google Cloud (Firebase) con las medidas de seguridad que provee dicha plataforma.
              El acceso a la API de WhatsApp está protegido por verificación de firma HMAC SHA256.
              No vendemos, alquilamos ni compartimos tus datos personales o financieros con terceros para fines comerciales.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">6. Tus derechos</h2>
            <p>Podés ejercer los siguientes derechos en cualquier momento escribiéndonos a <a href="mailto:hello@textthecheck.app" class="text-ttc-primary hover:text-ttc-primary/80">hello@textthecheck.app</a>:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li><strong class="text-ttc-text">Acceso:</strong> solicitar una copia de los datos que tenemos sobre vos.</li>
              <li><strong class="text-ttc-text">Rectificación:</strong> corregir datos incorrectos.</li>
              <li><strong class="text-ttc-text">Eliminación:</strong> solicitar la eliminación de tu cuenta y todos tus datos.</li>
              <li><strong class="text-ttc-text">Desvinculación:</strong> podés desvincular tu WhatsApp en cualquier momento desde tu Perfil o enviando DESVINCULAR por WhatsApp.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">7. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Si solicitás la eliminación de tu cuenta,
              eliminaremos todos tus datos personales y financieros en un plazo de 30 días.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">8. Menores de edad</h2>
            <p>
              text the check no está dirigido a menores de 18 años. No recopilamos intencionalmente datos de menores.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">9. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política periódicamente. Publicaremos cualquier cambio en esta misma página
              y actualizaremos la fecha de "última actualización". El uso continuado del servicio implica la
              aceptación de los cambios.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-ttc-text mt-8 mb-3">10. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con tu privacidad o tus datos, escribinos a
              <a href="mailto:hello@textthecheck.app" class="text-ttc-primary hover:text-ttc-primary/80">hello@textthecheck.app</a>.
            </p>
          </div>
        </section>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next'

definePageMeta({
  layout: 'landing',
  ssr: false
})

useHead({
  title: 'Política de Privacidad — text the check',
  meta: [
    { name: 'description', content: 'Política de privacidad de text the check. Cómo recopilamos, usamos y protegemos tus datos.' }
  ]
})
</script>
