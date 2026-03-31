<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-ttc-surface border-b border-ttc-border h-14">
    <div class="max-w-6xl mx-auto px-5 h-full flex items-center justify-between">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2.5 no-underline">
        <TtcSymbol size-class="w-9 h-9" class="text-ttc-primary" />
        <span class="font-outfit font-semibold text-[16px] tracking-[3px] leading-none text-ttc-text">
          text <span class="text-ttc-primary">the</span> check
        </span>
      </NuxtLink>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <ThemeToggle />
        <button
          @click="handleSignIn"
          class="font-body font-semibold text-[13px] text-white bg-ttc-primary px-[18px] py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
const { signInWithGoogle } = useAuth()
const router = useRouter()

async function handleSignIn() {
  try {
    await signInWithGoogle()
    router.push('/grupos')
  } catch {
    navigateTo('/iniciar-sesion')
  }
}
</script>
