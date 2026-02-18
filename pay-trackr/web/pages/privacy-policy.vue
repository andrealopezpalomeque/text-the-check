<template>
  <div class="py-6 w-full">
    <div class="container max-w-[80rem] m-auto px-[1.429rem]">
      <div class="prose prose-gray dark:prose-invert max-w-none">
        <h1>Política de Privacidad</h1>
        <p>
          Esta Política de Privacidad describe cómo WiseUtils ("nosotros") recopila, usa y protege
          tu información personal cuando utilizás PayTrackr ("la Aplicación").
        </p>

        <h2 class="mt-4">Información que Recopilamos</h2>
        <p>Cuando usás PayTrackr, recopilamos la siguiente información:</p>
        <ul>
          <li><strong>Información de cuenta de Google:</strong> nombre, dirección de correo electrónico y foto de perfil,
            proporcionados a través de Google Sign-In para autenticar tu cuenta.</li>
          <li><strong>Datos de pagos:</strong> títulos, montos, categorías, fechas de vencimiento y estados de pago
            que vos ingresás manualmente en la aplicación.</li>
          <li><strong>Token de notificaciones push:</strong> si habilitás las notificaciones, almacenamos un token
            de dispositivo para enviarte recordatorios de pago.</li>
          <li><strong>Número de WhatsApp:</strong> si habilitás la integración con WhatsApp, almacenamos tu número
            para enviarte resúmenes semanales.</li>
        </ul>

        <h2 class="mt-4">Cómo Usamos tu Información</h2>
        <p>Usamos tu información exclusivamente para:</p>
        <ul>
          <li>Autenticar tu identidad y proteger tu cuenta.</li>
          <li>Almacenar y mostrar tus pagos y datos financieros personales.</li>
          <li>Enviarte recordatorios y resúmenes de pagos (si los habilitás).</li>
        </ul>
        <p>
          <strong>No vendemos, compartimos ni transferimos tu información personal a terceros.</strong>
          No mostramos publicidad. No realizamos seguimiento con fines de marketing.
        </p>

        <h2 class="mt-4">Almacenamiento y Seguridad de Datos</h2>
        <p>
          Tus datos se almacenan en Google Firebase (Firestore), sujeto a las
          <a style="color: var(--primary-bg-color);" href="https://firebase.google.com/terms/">políticas de seguridad de Firebase</a>
          y la <a style="color: var(--primary-bg-color);" href="https://firebase.google.com/support/privacy">política de privacidad de Firebase</a>.
          Los datos se transmiten mediante conexiones cifradas (HTTPS/TLS).
        </p>
        <p>
          Cada usuario solo puede acceder a sus propios datos. No existe acceso compartido entre cuentas.
        </p>

        <h2 class="mt-4">Información Financiera</h2>
        <p>
          PayTrackr es una herramienta de seguimiento de pagos. <strong>No procesamos transacciones financieras,
          no accedemos a cuentas bancarias y no manejamos dinero real.</strong> Toda la información de pagos
          es ingresada manualmente por el usuario con fines organizativos.
        </p>

        <h2 class="mt-4">Eliminación de Datos</h2>
        <p>
          Podés eliminar tus datos en cualquier momento desde la aplicación eliminando tus pagos individualmente.
          Si deseás la eliminación completa de tu cuenta y todos los datos asociados, contactanos a través de la
          página de <NuxtLink style="color: var(--primary-bg-color);" href="/contact-us">Contacto</NuxtLink>
          y procesaremos tu solicitud en un plazo de 30 días.
        </p>

        <h2 class="mt-4">Servicios de Terceros</h2>
        <p>La aplicación utiliza los siguientes servicios de terceros:</p>
        <ul>
          <li><strong>Google Firebase:</strong> autenticación, base de datos y hosting.</li>
          <li><strong>Google Sign-In:</strong> inicio de sesión.</li>
          <li><strong>Firebase Cloud Messaging:</strong> notificaciones push.</li>
        </ul>
        <p>Cada servicio tiene sus propias políticas de privacidad que te recomendamos revisar.</p>

        <h2 class="mt-4">Cambios en esta Política</h2>
        <p>
          Nos reservamos el derecho de actualizar esta Política de Privacidad. Cualquier cambio será
          publicado en esta página con una fecha de vigencia actualizada.
        </p>

        <h2 class="mt-4">Información de Contacto</h2>
        <p>
          Si tenés preguntas sobre esta Política de Privacidad, contactanos usando la página de
          <NuxtLink style="color: var(--primary-bg-color);" href="/contact-us">Contacto</NuxtLink>.
        </p>

        <h2 class="mt-4">Fecha de Vigencia</h2>
        <p>
          Esta Política de Privacidad está vigente desde el 11 de febrero de 2026.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "landing"
})

useSeo({
  title: 'Política de Privacidad - PayTrackr',
  description: 'Conocé cómo PayTrackr recopila, usa y protege tu información personal.',
  path: '/privacy-policy',
})
</script>
