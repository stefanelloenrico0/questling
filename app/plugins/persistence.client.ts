// Carica lo stato PRIMA del primo render e della navigazione (il middleware dipende dal profilo).
// Gli altri plugin client dichiarano `dependsOn: ['persistence']`.
export default defineNuxtPlugin({
  name: 'persistence',
  async setup() {
    const game = useGameStore()
    await game.load()
  },
})
