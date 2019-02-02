module.exports = {
  title: 'Knorm',
  description: 'A JavaScript ORM written using ES6 classes',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      {
        text: 'Guides',
        items: [
          { text: 'Models', link: '/guides/models' },
          { text: 'Fields', link: '/guides/fields' },
          { text: 'Virtuals', link: '/guides/virtuals' },
          { text: 'Queries', link: '/guides/queries' },
          { text: 'Transactions', link: '/guides/transactions' },
          { text: 'Validation', link: '/guides/validation' },
          { text: 'Plugins', link: '/guides/plugins' },
          { text: 'Debugging', link: '/guides/debugging' }
        ]
      },
      { text: 'API Docs', link: '/api' },
      {
        text: 'Plugins',
        items: [
          { text: '@knorm/postgres', link: '/plugins/postgres' },
          { text: '@knorm/to-json', link: '/plugins/to-json' },
          { text: '@knorm/relations', link: 'https://github.com/knorm/relations' },
          { text: '@knorm/soft-delete', link: 'https://github.com/knorm/soft-delete' },
          { text: '@knorm/paginate', link: 'https://github.com/knorm/paginate' },
          { text: '@knorm/timestamps', link: 'https://github.com/knorm/timestamps' }
        ]
      },
      {
        text: 'About',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'License', link: '/license' },
          { text: 'Credits', link: '/credits' }
        ]
      },
      { text: 'Github', link: 'https://github.com/knorm/knorm' },
    ],
    sidebar: [
      '/',
      '/getting-started',
      {
        title: 'Guides',
        collapsable: false,
        children: [
          '/guides/models',
          '/guides/fields',
          '/guides/virtuals',
          '/guides/queries',
          '/guides/transactions',
          '/guides/validation',
          '/guides/plugins',
          '/guides/debugging'
        ]
      },
      ['/api', 'API Docs'],
      {
        title: 'Plugins',
        // collapsable: true,
        children: [
          '/plugins/postgres',
          '/plugins/to-json'
        ]
      },
      ['/changelog', 'Changelog' ],
      ['/license', 'License' ],
      ['/credits', 'Credits' ]
    ],
    sidebarDepth: 2,
    lastUpdated: 'Last updated',
    markdown: {
      lineNumbers: true
    }
  }
};
