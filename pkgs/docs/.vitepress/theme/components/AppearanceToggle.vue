<script setup lang="ts">
import { ref, watchPostEffect } from "vue";
import { useData } from "vitepress";

const { isDark } = useData();

// isDark is always false during SSR. Set the attributes after hydration so that they do not mismatch on dark OS settings
const title = ref("");
const pressed = ref(false);
watchPostEffect(() => {
  title.value = isDark.value ? "Switch to light mode" : "Switch to dark mode";
  pressed.value = isDark.value;
});
</script>

<template>
  <button
    class="appearance-toggle"
    type="button"
    :title="title"
    aria-label="Appearance"
    :aria-pressed="pressed"
    @click="isDark = !isDark"
  >
    <!-- Both icons are rendered and switched by the .dark class, because Vue does not patch class mismatches on hydration -->
    <span class="vpi-sun sun" aria-hidden="true" />
    <span class="vpi-moon moon" aria-hidden="true" />
  </button>
</template>

<style scoped>
.appearance-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-left: auto;
  border-radius: 50%;
  color: var(--vp-c-text-1);
  transition: background-color 0.2s;
}

.appearance-toggle:hover {
  background-color: var(--vp-c-default-soft);
}

.appearance-toggle span {
  width: 1.5rem;
  height: 1.5rem;
}

.moon,
.dark .sun {
  display: none;
}

.dark .moon {
  display: inline-block;
}

/* Below this width VitePress moves the appearance switch into the hamburger menu */
@media (min-width: 48rem) {
  .appearance-toggle {
    display: flex;
  }
}
</style>
