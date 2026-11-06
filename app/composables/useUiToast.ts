// Toast: primitivo accessibile di Nuxt UI (useToast), stile sovrascritto in app.config.ts.
export function useUiToast() {
  const toast = useToast()
  return {
    show(title: string, description?: string) {
      toast.add({ title, description, duration: 2500 })
    },
  }
}
