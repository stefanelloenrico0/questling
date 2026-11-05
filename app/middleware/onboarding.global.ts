// Senza profilo si va sempre all'onboarding; con profilo l'onboarding non e' piu' raggiungibile.
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/kit') return
  const hasProfile = !!useGameStore().profile
  if (!hasProfile && to.path !== '/onboarding') return navigateTo('/onboarding')
  if (hasProfile && to.path === '/onboarding') return navigateTo('/')
})
