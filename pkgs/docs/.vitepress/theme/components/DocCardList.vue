<script setup lang="ts">
import { withBase } from "vitepress";

defineProps<{
  items: { title: string; link: string; description: string }[];
}>();
</script>

<template>
  <div class="doc-card-list">
    <a
      v-for="item in items"
      :key="item.link"
      class="doc-card"
      :href="withBase(item.link)"
    >
      <span class="doc-card-title">📄️ {{ item.title }}</span>
      <span class="doc-card-description" :title="item.description">
        {{ item.description }}
      </span>
    </a>
  </div>
</template>

<style scoped>
.doc-card-list {
  display: grid;
  gap: 2rem;
  margin-top: 1.5rem;
}

@media (min-width: 997px) {
  .doc-card-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.vp-doc a.doc-card {
  display: block;
  padding: 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.8rem;
  color: var(--vp-c-text-1);
  text-decoration: none;
  box-shadow: 0 1.5px 3px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.vp-doc a.doc-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.2);
}

.doc-card-title {
  display: block;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 700;
}

.doc-card-description {
  display: block;
  overflow: hidden;
  font-size: 0.8rem;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
