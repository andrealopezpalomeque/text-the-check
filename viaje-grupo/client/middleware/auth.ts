const publicRoutes = ['/login', '/setup', '/join']

export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server - Firebase auth only works on client
  // Protected pages use ssr: false to avoid hydration mismatches
  if (import.meta.server) {
    return
  }

  // Client-side auth check
  const { isAuthenticated, isFirebaseAuthenticated, loading } = useAuth()

  // SECURITY: While auth is loading, only allow access to public pages
  // All other pages must wait for auth to resolve to prevent unauthorized access
  if (loading.value) {
    if (publicRoutes.includes(to.path)) {
      return
    }
    // For protected routes, don't allow access during loading
    // The page will show a loading state via app.vue's authLoading check
    return
  }

  // After auth is loaded, enforce access control
  // /setup and /join require Firebase auth (Google sign-in) but not necessarily a group
  if (to.path === '/setup' || to.path === '/join') {
    if (!isFirebaseAuthenticated.value) {
      window.location.href = '/login'
      return abortNavigation()
    }
    return
  }

  // If not authenticated and trying to access a protected route, redirect to login
  if (!isAuthenticated.value && to.path !== '/login') {
    window.location.href = '/login'
    return abortNavigation()
  }

  // If authenticated and trying to access login page, redirect to home
  if (isAuthenticated.value && to.path === '/login') {
    // Use replace to prevent back button returning to login
    return navigateTo('/', { replace: true })
  }
})
