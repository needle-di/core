import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Needle DI",
  description: "A lightweight, type-safe Dependency Injection (DI) library",
  base: '/needle-di/',
  themeConfig: {
    siteTitle: 'Needle DI',
    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/dirkluijk/needle-di/edit/main/docs/:path'
    },

    lastUpdated: {
      text: 'Last updated'
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/concepts/binding' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Needle DI?', link: '/what-is-needle-di' },
          { text: 'Getting started', link: '/getting-started' },
        ]
      },
      {
        text: 'Concepts',
        items: [
          { text: 'Binding', link: '/concepts/binding' },
          { text: 'Containers', link: '/concepts/containers' },
          { text: 'Injection', link: '/concepts/injection' },
          { text: 'Providers', link: '/concepts/providers' },
          { text: 'Tokens', link: '/concepts/tokens' },
        ]
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Optional injection', link: '/advanced/optional-injection' },
          { text: 'Multi-injection', link: '/advanced/multi-injection' },
          { text: 'Inheritance', link: '/advanced/inheritance' },
          { text: 'Tree-shaking', link: '/advanced/tree-shaking' },
          { text: 'Async injection', link: '/advanced/async-injection' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/dirkluijk/needle-di' }
    ],

    footer: {
      message: 'Released under the MIT License',
      copyright: 'Copyright © 2024 Dirk Luijk'
    }
  }
})