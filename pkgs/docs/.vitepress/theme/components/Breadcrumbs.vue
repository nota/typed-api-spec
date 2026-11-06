<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import { useLayout, type DefaultTheme } from "vitepress/theme-without-fonts";

type Crumb = { text: string; link?: string };

const { page } = useData();
const { sidebar } = useLayout();

const findTrail = (
  items: readonly DefaultTheme.SidebarItem[],
  path: string,
): Crumb[] | undefined => {
  for (const item of items) {
    const crumb = { text: item.text ?? "", link: item.link };
    if (item.link === path) return [crumb];
    const rest = item.items && findTrail(item.items, path);
    if (rest) return [crumb, ...rest];
  }
};

const trail = computed(() => {
  // page.relativePath is the rewritten path, e.g. docs/client/overview/index.md
  const path = "/" + page.value.relativePath.replace(/index\.md$/, "");
  return findTrail(sidebar.value, path) ?? [];
});
</script>

<template>
  <nav v-if="trail.length" class="breadcrumbs" aria-label="Breadcrumbs">
    <ul>
      <li>
        <a :href="withBase('/')" aria-label="Home page" class="home">
          <!-- Lucide "house", the icon set VitePress uses for its own icons -->
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path
              d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            />
          </svg>
        </a>
      </li>
      <li v-for="(crumb, i) in trail" :key="i">
        <span v-if="i === trail.length - 1" class="crumb current">
          {{ crumb.text }}
        </span>
        <a v-else-if="crumb.link" class="crumb" :href="withBase(crumb.link)">
          {{ crumb.text }}
        </a>
        <span v-else class="crumb">{{ crumb.text }}</span>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  margin-bottom: 0.8rem;
}

.breadcrumbs ul {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.breadcrumbs li {
  display: flex;
  align-items: center;
}

.breadcrumbs li + li::before {
  margin: 0 0.5rem;
  color: var(--vp-c-text-2);
  content: "›";
}

.home {
  display: flex;
  padding: 0.4rem;
  border-radius: 1.5rem;
  color: var(--vp-c-text-1);
}

.home svg {
  width: 1.1rem;
  height: 1.1rem;
}

.crumb {
  padding: 0.4rem 0.8rem;
  border-radius: 1.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.home:hover,
a.crumb:hover {
  background-color: var(--vp-c-default-soft);
}

.crumb.current {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-brand-soft);
}
</style>
