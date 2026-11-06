import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import AppearanceToggle from "./components/AppearanceToggle.vue";
import Breadcrumbs from "./components/Breadcrumbs.vue";
import DocCardList from "./components/DocCardList.vue";
import HomeHero from "./components/HomeHero.vue";
import SiteFooter from "./components/SiteFooter.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "home-hero-before": () => h(HomeHero),
      "nav-bar-content-after": () => h(AppearanceToggle),
      "doc-before": () => h(Breadcrumbs),
      "layout-bottom": () => h(SiteFooter),
    }),
  enhanceApp({ app }) {
    app.component("DocCardList", DocCardList);
  },
} satisfies Theme;
