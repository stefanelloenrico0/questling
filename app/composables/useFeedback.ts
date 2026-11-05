/** Feedback unico per suono + vibrazione, cosi' le pagine non conoscono i dettagli. */
export function useFeedback() {
  const sfx = useSfx()
  const haptics = useHaptics()
  return {
    tap: (): void => sfx.play('tap'),
    complete: (): void => {
      sfx.play('complete')
      haptics.light()
    },
    levelUp: (): void => {
      sfx.play('levelup')
      haptics.success()
    },
    error: (): void => sfx.play('error'),
  }
}
