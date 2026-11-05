// Toast in stile pixel: primitivo accessibile di Nuxt UI (useToast), stile sovrascritto in app.config.ts.
export function usePixelToast() {
  const toast = useToast()
  return {
    show(title: string, description?: string) {
      toast.add({ title, description, duration: 2500 })
    },
  }
}
