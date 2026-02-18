<template>
  <div class="py-6 w-full">
    <div class="container max-w-[80rem] m-auto px-[1.429rem]">
      <div class="prose prose-gray dark:prose-invert max-w-none">
        <h1>Términos y Condiciones de Uso</h1>
        <p>
          Bienvenido a WiseUtils (Sección PayTrackr). Al acceder o utilizar el Sitio Web, aceptás
          cumplir y estar sujeto a los siguientes términos y condiciones ("Términos y Condiciones").
          Por favor leé estos Términos y Condiciones cuidadosamente antes de acceder o utilizar el Sitio Web.
        </p>
        <h2 class="mt-4">Aceptación de los Términos</h2>
        <p>
          Al acceder o utilizar el Sitio Web, aceptás estar sujeto a estos Términos y Condiciones.
          Si no estás de acuerdo con alguna parte de estos términos, no podés acceder al Sitio Web.
        </p>
        <h2 class="mt-4">Uso del Sitio Web</h2>
        <p>
          El Sitio Web permite a los usuarios gestionar sus pagos mensuales agregando, editando, eliminando pagos,
          viendo el historial de pagos y marcando pagos como pagados o no pagados.
        </p>
        <h2 class="mt-4">Responsabilidades del Usuario</h2>
        <p>
          Sos responsable de mantener la confidencialidad de tu cuenta y contraseña, y de restringir
          el acceso a tu dispositivo. Aceptás asumir la responsabilidad de todas las actividades que ocurran
          bajo tu cuenta o contraseña.
        </p>
        <p>
          Aceptás no utilizar el Sitio Web para ningún propósito ilegal o que viole las leyes o regulaciones aplicables.
        </p>
        <h2 class="mt-4">Gestión de Datos</h2>
        <p>
          El Sitio Web utiliza Firebase para la gestión de datos.
          Tus datos están sujetos a las
          <a style="color: var(--primary-bg-color);" href="https://firebase.google.com/terms/">reglas de seguridad
            y políticas de Firebase</a>.
          No gestionamos dinero ni transacciones financieras a través del Sitio Web.
        </p>
        <h2 class="mt-4">Limitación de Responsabilidad</h2>
        <p>
          El Sitio Web se proporciona "tal cual" y "según disponibilidad".
          No garantizamos que el Sitio Web funcione sin interrupciones, de manera oportuna, segura o sin errores.
        </p>
        <p>
          En ningún caso seremos responsables por daños directos, indirectos, incidentales, especiales,
          consecuentes o punitivos que surjan del uso del Sitio Web o estén relacionados con él.
        </p>
        <h2 class="mt-4">Cambios en los Términos y Condiciones</h2>
        <p>
          Nos reservamos el derecho de modificar o actualizar estos Términos y Condiciones en cualquier momento.
          Cualquier cambio entrará en vigencia inmediatamente después de su publicación en el Sitio Web.
          Tu uso continuado del Sitio Web después de la publicación de los Términos y Condiciones revisados
          constituye tu aceptación de dichos cambios.
        </p>
        <h2 class="mt-4">Terminación</h2>
        <p>
          Nos reservamos el derecho de terminar o suspender tu cuenta y acceso al Sitio Web en cualquier momento
          sin previo aviso ni responsabilidad por cualquier motivo.
        </p>
        <h2 class="mt-4">Información de Contacto</h2>
        <p>
          Si tenés alguna pregunta sobre estos Términos y Condiciones, por favor contactanos usando la página de
          <NuxtLink href="/contact-us">Contacto</NuxtLink>.
        </p>
        <h2 class="mt-4">Fecha de Vigencia</h2>
        <p>
          Estos Términos y Condiciones están vigentes desde el 29 de marzo de 2024.
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
  title: 'Términos y Condiciones - PayTrackr',
  description: 'Conocé los términos y condiciones de uso de PayTrackr.',
  path: '/term-of-service',
})
</script>
