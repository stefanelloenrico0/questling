<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ default: '' })
defineProps<{ label: string }>()
const id = useId()
</script>

<template>
  <div class="ui-input">
    <label class="ui-input__label" :for="id">{{ label }}</label>
    <input :id="id" v-model="model" type="text" autocomplete="off" v-bind="$attrs" class="ui-input__field" />
  </div>
</template>

<style scoped>
.ui-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ui-input__label {
  color: var(--text-soft);
  font-size: 15px;
  font-weight: 600;
}
.ui-input__field {
  min-height: 50px;
  padding: 10px 14px;
  color: var(--text);
  font: inherit;
  background: var(--bg);
  border: 1.5px solid var(--edge);
  border-radius: var(--radius-m);
  user-select: text;
  -webkit-user-select: text;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.ui-input__field:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 28%, transparent);
}
.ui-input__field[type='time'] {
  color-scheme: dark;
}
.ui-input__field::placeholder {
  color: var(--text-soft);
  opacity: 0.65;
}
</style>
