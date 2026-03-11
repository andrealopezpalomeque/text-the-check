<template>
  <div>
    <button
      @click="showConfirmDialog = true"
      class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors font-medium"
    >
      <IconLogout class="w-5 h-5" />
      Cerrar sesion
    </button>

    <ConfirmDialog
      v-model="showConfirmDialog"
      title="Cerrar sesión"
      message="¿Seguro que querés cerrar sesión?"
      confirm-text="Sí, cerrar sesión"
      cancel-text="Cancelar"
      variant="danger"
      @confirm="handleLogout"
    />
  </div>
</template>

<script setup>
import IconLogout from '~icons/mdi/logout'

const router = useRouter()
const { signOut } = useAuth()

const showConfirmDialog = ref(false)

const handleLogout = async () => {
  try {
    await signOut()
    router.push('/iniciar-sesion')
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}
</script>
