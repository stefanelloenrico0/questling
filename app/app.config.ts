// Override del tema Nuxt UI: solo primitivi accessibili, look interamente pixel.
export default defineAppConfig({
  ui: {
    colors: { primary: 'sky', neutral: 'slate' },
    toast: {
      slots: {
        root: 'bg-[var(--surface)] text-[var(--text)] rounded-none ring-0 shadow-[0_-4px_0_0_var(--accent),0_4px_0_0_var(--accent),-4px_0_0_0_var(--accent),4px_0_0_0_var(--accent)]',
        title: 'font-display text-xs text-[var(--xp)]',
        description: 'text-[var(--text-soft)]',
        progress: 'hidden',
      },
    },
  },
})
