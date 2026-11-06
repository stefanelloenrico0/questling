// Override del tema Nuxt UI: solo primitivi accessibili (Modal/Drawer/Toast), con il look di Questling.
export default defineAppConfig({
  ui: {
    colors: { primary: 'sky', neutral: 'slate' },
    toast: {
      slots: {
        root: 'bg-[var(--surface)] text-[var(--text)] rounded-2xl ring-1 ring-[var(--edge)] shadow-[0_14px_30px_-12px_rgb(0_0_0/0.7)]',
        title: 'font-display text-base text-[var(--xp)]',
        description: 'text-[var(--text-soft)]',
        progress: 'hidden',
      },
    },
  },
})
