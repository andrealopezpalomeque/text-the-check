<template>
  <div class="min-h-screen bg-ttc-bg">
    <div class="container mx-auto px-4 py-12 max-w-3xl">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver al inicio
      </NuxtLink>

      <article class="prose prose-invert prose-gray max-w-none">
        <h1 class="font-display text-3xl font-bold text-white mb-2">Politica de Privacidad</h1>
        <p class="text-gray-400 text-sm mb-8">Ultima actualizacion: 19 de febrero de 2026</p>

        <section class="space-y-6 text-gray-300 leading-relaxed">
          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">1. Responsables</h2>
            <p>
              <strong class="text-white">text the check</strong> es operado por Imanol Ariel Corimayo y Andrea Lopez Palomeque
              (en adelante, "nosotros"). Para cualquier consulta sobre esta politica o el tratamiento de tus datos,
              podes escribirnos a <a href="mailto:hello@textthecheck.app" class="text-blue-400 hover:text-blue-300">hello@textthecheck.app</a>.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">2. Que datos recopilamos</h2>
            <p>Cuando usas text the check, recopilamos y almacenamos:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li><strong class="text-white">Datos de cuenta:</strong> nombre, direccion de email y foto de perfil proporcionados por Google al iniciar sesion.</li>
              <li><strong class="text-white">Numero de telefono de WhatsApp:</strong> cuando vinculas tu cuenta mediante el flujo VINCULAR.</li>
              <li><strong class="text-white">Datos financieros que vos registras:</strong> gastos, pagos, categorias, gastos recurrentes y balances de grupo.</li>
              <li><strong class="text-white">Mensajes de WhatsApp:</strong> el contenido de los mensajes que nos envias (texto, audio, imagenes y PDFs de comprobantes) para procesarlos y registrar tus gastos.</li>
              <li><strong class="text-white">Informacion de pago:</strong> CBU/CVU y alias bancario, si decidis cargarlos en tu perfil.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">3. Como usamos tus datos</h2>
            <p>Utilizamos tus datos exclusivamente para:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li>Registrar y mostrar tus gastos personales y grupales.</li>
              <li>Procesar los mensajes que envias por WhatsApp (texto, audio, imagenes, PDFs) para extraer informacion de gastos.</li>
              <li>Generar resumenes y analisis de tus finanzas.</li>
              <li>Facilitar la division de gastos entre miembros de un grupo.</li>
              <li>Enviar notificaciones de recordatorio de pagos.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">4. Servicios de terceros</h2>
            <p>text the check utiliza los siguientes servicios de terceros para funcionar:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li><strong class="text-white">Google Firebase:</strong> autenticacion, base de datos (Firestore) y alojamiento. Tus datos se almacenan en los servidores de Google.</li>
              <li><strong class="text-white">WhatsApp Business API (Meta):</strong> para recibir y enviar mensajes. Meta procesa los mensajes segun su propia politica de privacidad.</li>
              <li><strong class="text-white">Google Gemini AI:</strong> para procesar audio, imagenes y PDFs de comprobantes. El contenido se envia a los servidores de Google para su analisis y no se almacena por Google mas alla del procesamiento.</li>
              <li><strong class="text-white">Sentry:</strong> para monitoreo de errores. Se envian datos tecnicos (no financieros) para diagnosticar problemas.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">5. Almacenamiento y seguridad</h2>
            <p>
              Tus datos se almacenan en Google Cloud (Firebase) con las medidas de seguridad que provee dicha plataforma.
              El acceso a la API de WhatsApp esta protegido por verificacion de firma HMAC SHA256.
              No vendemos, alquilamos ni compartimos tus datos personales o financieros con terceros para fines comerciales.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">6. Tus derechos</h2>
            <p>Podes ejercer los siguientes derechos en cualquier momento escribiendonos a <a href="mailto:hello@textthecheck.app" class="text-blue-400 hover:text-blue-300">hello@textthecheck.app</a>:</p>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li><strong class="text-white">Acceso:</strong> solicitar una copia de los datos que tenemos sobre vos.</li>
              <li><strong class="text-white">Rectificacion:</strong> corregir datos incorrectos.</li>
              <li><strong class="text-white">Eliminacion:</strong> solicitar la eliminacion de tu cuenta y todos tus datos.</li>
              <li><strong class="text-white">Desvinculacion:</strong> podes desvincular tu WhatsApp en cualquier momento desde tu Perfil o enviando DESVINCULAR por WhatsApp.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">7. Retencion de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta este activa. Si solicitas la eliminacion de tu cuenta,
              eliminaremos todos tus datos personales y financieros en un plazo de 30 dias.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">8. Menores de edad</h2>
            <p>
              text the check no esta dirigido a menores de 18 anios. No recopilamos intencionalmente datos de menores.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">9. Cambios a esta politica</h2>
            <p>
              Podemos actualizar esta politica periodicamente. Publicaremos cualquier cambio en esta misma pagina
              y actualizaremos la fecha de "ultima actualizacion". El uso continuado del servicio implica la
              aceptacion de los cambios.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-white mt-8 mb-3">10. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con tu privacidad o tus datos, escribinos a
              <a href="mailto:hello@textthecheck.app" class="text-blue-400 hover:text-blue-300">hello@textthecheck.app</a>.
            </p>
          </div>
        </section>
      </article>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'landing',
  ssr: false
})

useHead({
  title: 'Politica de Privacidad — text the check',
  meta: [
    { name: 'description', content: 'Politica de privacidad de text the check. Como recopilamos, usamos y protegemos tus datos.' }
  ]
})
</script>
