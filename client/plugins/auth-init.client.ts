export default defineNuxtPlugin({
  name: 'auth-init',
  dependsOn: ['firebase'],
  async setup() {
    const { initAuth } = useAuth()
    await initAuth()
  }
})
