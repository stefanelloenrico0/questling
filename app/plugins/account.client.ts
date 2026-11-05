// Account e sync sono OPZIONALI: se Firebase non e' configurato il plugin non fa nulla.
// L'avvio e' differito: la prima schermata non aspetta mai la rete.
export default defineNuxtPlugin({
  name: 'account',
  dependsOn: ['persistence'],
  setup() {
    const account = useAccountStore()
    if (!account.available) return
    setTimeout(() => void account.init(), 300)
  },
})
