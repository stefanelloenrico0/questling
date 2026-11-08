import { LOCALE_TAGS, type Locale } from '../../core/locale'

/** Tag BCP 47 della lingua attuale (per Intl e toLocale*String). */
export function useLocaleTag() {
  const { locale } = useI18n()
  return computed(() => LOCALE_TAGS[locale.value as Locale] ?? LOCALE_TAGS.it)
}
