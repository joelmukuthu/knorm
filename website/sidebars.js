module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/introduction', 'getting-started/usage']
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/models',
        'guides/fields',
        'guides/virtuals',
        'guides/queries',
        'guides/transactions',
        'guides/validation',
        'guides/plugins',
        'guides/debugging'
      ]
    },
    {
      type: 'category',
      label: 'Plugins',
      items: [
        'plugins/postgres',
        'plugins/to-json',
        'plugins/relations',
        'plugins/soft-delete',
        'plugins/paginate',
        'plugins/timestamps'
      ]
    }
  ]
};
