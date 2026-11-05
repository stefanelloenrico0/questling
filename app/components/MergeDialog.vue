<script setup lang="ts">
// Primo accesso con dati da entrambe le parti: riepilogo e conferma PRIMA di unire (spec §11).
const account = useAccountStore()
const { t } = useI18n()

const pending = computed(() => account.pendingMerge)
const open = computed({
  get: () => pending.value !== null,
  set: () => {}, // non si chiude con ESC o toccando fuori: serve una scelta esplicita
})

const rows = computed(() => {
  const s = pending.value?.stats
  if (!s) return []
  return [
    { key: 'quests', label: t('sync.merge.quests'), here: s.quests.localOnly, cloud: s.quests.remoteOnly, both: s.quests.both },
    { key: 'completions', label: t('sync.merge.completions'), here: s.completions.localOnly, cloud: s.completions.remoteOnly, both: s.completions.both },
    { key: 'events', label: t('sync.merge.events'), here: s.xpEvents.localOnly, cloud: s.xpEvents.remoteOnly, both: null },
  ]
})
</script>

<template>
  <PixelDialog
    v-if="pending"
    v-model:open="open"
    :dismissible="false"
    :title="t('sync.merge.title')"
    :description="t('sync.merge.body')"
  >
    <div class="flex flex-col gap-3" data-testid="merge-dialog">
      <p v-if="pending.otherAccount" class="text-[var(--warn)]" role="alert">{{ t('sync.merge.otherAccount') }}</p>
      <table class="w-full text-left" data-testid="merge-table">
        <thead>
          <tr class="text-[var(--text-soft)]">
            <th scope="col" />
            <th scope="col">{{ t('sync.merge.colThis') }}</th>
            <th scope="col">{{ t('sync.merge.colCloud') }}</th>
            <th scope="col">{{ t('sync.merge.colBoth') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.key" :data-row="r.key">
            <th scope="row" class="font-normal">{{ r.label }}</th>
            <td>{{ r.here }}</td>
            <td>{{ r.cloud }}</td>
            <td>{{ r.both ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="pending.stats.xpCorrections > 0" class="text-[var(--text-soft)]">
        {{ t('sync.merge.corrections', { n: pending.stats.xpCorrections }) }}
      </p>
      <p class="text-[var(--text-soft)]">{{ t('sync.merge.backupNote') }}</p>
    </div>
    <template #actions>
      <div class="flex flex-wrap justify-end gap-2">
        <PixelButton variant="secondary" data-testid="merge-cancel" @click="account.cancelMerge()">{{ t('sync.merge.cancel') }}</PixelButton>
        <PixelButton data-testid="merge-confirm" @click="account.confirmMerge()">{{ t('sync.merge.confirm') }}</PixelButton>
      </div>
    </template>
  </PixelDialog>
</template>
