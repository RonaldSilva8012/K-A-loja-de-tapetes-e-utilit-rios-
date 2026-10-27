export default {
  name: 'product',
  title: 'Produtos da Loja',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Nome do Produto',
      type: 'string',
      validation: Rule => Rule.required().error('O nome é obrigatório!')
    },
    {
      name: 'description',
      title: 'Descrição do Produto',
      type: 'text',
      description: 'Detalhes, materiais ou características do produto'
    },
    {
      name: 'category',
      title: 'Categoria do Produto',
      type: 'string',
      description: 'Selecione onde este produto vai aparecer no site',
      options: {
        list: [
          { title: 'Tapetes', value: 'tapetes' },
          { title: 'Panos de Prato', value: 'panos-de-prato' },
          { title: 'Outros / Novo Item', value: 'outros' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required().error('A categoria é obrigatória!')
    },
    {
      name: 'customCategory',
      title: 'Nome da Nova Categoria',
      type: 'string',
      description: 'Preencha apenas se selecionou "Outros / Novo Item" acima',
      hidden: ({ parent }) => parent?.category !== 'outros'
    },
    {
      name: 'price',
      title: 'Preço Base (R$)',
      type: 'string',
      description: 'Preço padrão ou principal do produto',
      validation: Rule => Rule.required().error('O preço é obrigatório!')
    },
    {
      name: 'sizes',
      title: 'Tamanhos e Variações',
      type: 'array',
      description: 'Adicione opções de tamanho (ex: Tamanho Único, Pequeno, Grande, etc.)',
      of: [
        {
          type: 'object',
          name: 'sizeOption',
          title: 'Opção de Tamanho',
          fields: [
            {
              name: 'sizeLabel',
              title: 'Descrição do Tamanho',
              type: 'string',
              description: 'Ex: Tamanho Único, 50x70cm, Grande (100x150cm)',
              validation: Rule => Rule.required()
            },
            {
              name: 'sizePrice',
              title: 'Preço Específico para este Tamanho (R$)',
              type: 'string',
              description: 'Opcional: preencha se este tamanho tiver um valor diferente do preço base.'
            }
          ]
        }
      ],
      initialValue: [
        { sizeLabel: 'Tamanho Único' }
      ]
    },
    {
      name: 'image',
      title: 'Foto do Produto',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: Rule => Rule.required().error('A foto é obrigatória!')
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'price',
      media: 'image',
      category: 'category'
    },
    prepare(selection) {
      const { title, subtitle, media, category } = selection;
      return {
        title: title,
        subtitle: `R$ ${subtitle} | Cat: ${category || 'Geral'}`,
        media: media
      };
    }
  }
}