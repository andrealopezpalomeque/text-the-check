export default defineNuxtPlugin({
  name: 'auth-init',
  dependsOn: ['firebase'],
  async setup() {
    // Wait for auth to initialize before allowing routing
    // This ensures the middleware has auth state available
    const { initAuth } = useAuth()

    // initAuth now returns a Promise that resolves when auth state is determined
    await initAuth()
  }
})
