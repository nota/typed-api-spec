import { defineConfig } from "vitepress";

export default defineConfig({
  title: "typed-api-spec",
  description:
    "TypeScript based declarative API specification and zero-runtime client",
  lang: "en",
  base: "/typed-api-spec/",
  head: [["link", { rel: "icon", href: "/typed-api-spec/favicon.ico" }]],
  sitemap: { hostname: "https://nota.github.io/typed-api-spec/" },
  markdown: { theme: { light: "github-light", dark: "dracula" } },

  // Emit docs/foo.md as docs/foo/index.html so that existing links like /docs/foo/ keep working
  rewrites(id) {
    return id.startsWith("docs/") ? id.replace(/\.md$/, "/index.md") : id;
  },

  themeConfig: {
    logo: "/img/logo.png",
    nav: [
      { text: "Docs", link: "/docs/overview/" },
      { text: "Playground", link: "/docs/playground/" },
    ],
    sidebar: [
      { text: "Overview", link: "/docs/overview/" },
      { text: "Getting Started", link: "/docs/getting-started/" },
      { text: "API Specification", link: "/docs/api-specification/" },
      {
        text: "Client",
        collapsed: true,
        link: "/docs/category/client/",
        items: [
          { text: "Client(zero-fetch)", link: "/docs/client/overview/" },
          { text: "Validation", link: "/docs/client/validation/" },
        ],
      },
      {
        text: "Server",
        collapsed: true,
        link: "/docs/category/server/",
        items: [
          { text: "Express", link: "/docs/server/express/" },
          { text: "Fastify", link: "/docs/server/fastify/" },
          { text: "MSW (Mock Service Worker)", link: "/docs/server/msw/" },
        ],
      },
      {
        text: "Validation",
        collapsed: true,
        link: "/docs/category/validation/",
        items: [
          { text: "Overview", link: "/docs/validation/concept/" },
          { text: "zod", link: "/docs/validation/zod/" },
          { text: "Valibot", link: "/docs/validation/valibot/" },
          {
            text: "Standard Schema",
            link: "/docs/validation/standard-schema/",
          },
        ],
      },
      { text: "OpenAPI (Experimental)", link: "/docs/openapi/" },
      { text: "Playground", link: "/docs/playground/" },
    ],
    outline: { level: [2, 3] },
    docFooter: { prev: "Previous", next: "Next" },
  },
});
