<script setup lang="ts">
import { useData, withBase } from "vitepress";

const { site } = useData();
</script>

<template>
  <header class="home-hero">
    <h1 class="home-hero-title">{{ site.title }}</h1>
    <p class="home-hero-tagline">{{ site.description }}</p>
    <a class="home-hero-button" :href="withBase('/docs/getting-started/')">
      Getting Started - 5min ⏱️
    </a>
  </header>
</template>

<style scoped>
.home-hero {
  padding: 4rem 1.5rem;
  text-align: center;
  color: #fff;
  background-color: var(--vp-c-brand-1);
}

.home-hero-title {
  margin: 0;
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.25;
}

.home-hero-tagline {
  margin: 1.25rem 0 0;
  font-size: 1.5rem;
  line-height: 1.4;
}

.home-hero-button {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.5rem 2rem;
  border-radius: 0.4rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.5;
  color: #1c1e21;
  background-color: #ebedf0;
  transition: background-color 0.2s;
}

.home-hero-button:hover {
  background-color: #d4d5d8;
}

@media (max-width: 996px) {
  .home-hero {
    padding: 2rem;
  }
}
</style>
