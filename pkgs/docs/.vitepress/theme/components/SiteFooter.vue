<template>
  <footer class="site-footer">
    <div class="site-footer-column">
      <p class="site-footer-title">More</p>
      <a
        class="site-footer-link"
        href="https://github.com/nota/typed-api-spec"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub <span aria-hidden="true">↗</span>
      </a>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  /* The sidebar is position: fixed with z-index 25 on wide screens. Stay above it so that the footer covers the full width */
  z-index: 26;
  padding: 2rem 2.5rem;
  color: #ebedf0;
  background-color: #303846;
}

.site-footer-title {
  margin: 0 0 0.5rem;
  font-weight: 700;
}

.site-footer-link {
  line-height: 2;
  color: #ebedf0;
}

.site-footer-link:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
</style>
