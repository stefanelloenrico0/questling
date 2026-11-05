<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ default: '' })
defineProps<{ label: string }>()
const id = useId()
</script>

<template>
  <div class="pixel-input">
    <label class="pixel-input__label" :for="id">{{ label }}</label>
    <input :id="id" v-model="model" type="text" autocomplete="off" v-bind="$attrs" class="pixel-input__field" />
  </div>
</template>

<style scoped>
.pixel-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pixel-input__label {
  color: var(--text-soft);
}
.pixel-input__field {
  min-height: 48px;
  margin: 4px;
  padding: 8px 12px;
  color: var(--text);
  font: inherit;
  background: var(--bg);
  border: 0;
  border-radius: 0;
  user-select: text;
  -webkit-user-select: text;
  box-shadow:
    0 -4px 0 0 var(--surface-2),
    0 4px 0 0 var(--surface-2),
    -4px 0 0 0 var(--surface-2),
    4px 0 0 0 var(--surface-2);
}
.pixel-input__field:focus {
  outline: none;
  box-shadow:
    0 -4px 0 0 var(--accent),
    0 4px 0 0 var(--accent),
    -4px 0 0 0 var(--accent),
    4px 0 0 0 var(--accent);
}
.pixel-input__field[type="time"] {
  color-scheme: dark;
}
.pixel-input__field::placeholder {
  color: var(--text-soft);
  opacity: 0.7;
}
</style>
