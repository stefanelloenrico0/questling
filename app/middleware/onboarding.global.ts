// Senza profilo si va sempre all'onboarding; con profilo l'onboarding non e' piu' raggiungibile.
export default defineNuxtRouteMiddleware((to) => {
  // Raggiungibili anche senza profilo: /account serve a ritrovare i dati su un dispositivo nuovo, /privacy e' pubblica
  if (['/privacy', '/account'].includes(to.path)) return
  const hasProfile = !!useGameStore().profile
  if (!hasProfile && to.path !== '/onboarding') return navigateTo('/onboarding')
  if (hasProfile && to.path === '/onboarding') return navigateTo('/')
})
