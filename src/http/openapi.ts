export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Menu API',
    version: '1.0.0',
    description: 'API para criação, consulta e exclusão de itens de menu hierárquicos.',
  },
  tags: [
    {
      name: 'Menu',
      description: 'Operações de gestão dos itens de menu',
    },
    {
      name: 'Health',
      description: 'Verificação de disponibilidade da aplicação',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica se a aplicação está disponível',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Aplicação disponível',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
                example: { status: 'ok' },
              },
            },
          },
        },
      },
    },
    '/api/v1/menu': {
      post: {
        tags: ['Menu'],
        summary: 'Cria um item de menu',
        operationId: 'createMenuItem',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateMenuItemRequest',
              },
              examples: {
                root: {
                  summary: 'Item raiz',
                  value: { name: 'Eletrodomésticos' },
                },
                child: {
                  summary: 'Subitem',
                  value: { name: 'Televisores', relatedId: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Item criado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateMenuItemResponse',
                },
                example: { id: '1' },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/InvalidRequest',
          },
          '404': {
            $ref: '#/components/responses/ParentNotFound',
          },
          '409': {
            $ref: '#/components/responses/NameConflict',
          },
        },
      },
      get: {
        tags: ['Menu'],
        summary: 'Consulta o menu completo',
        operationId: 'getMenu',
        responses: {
          '200': {
            description: 'Menu completo em formato hierárquico',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/MenuNode',
                  },
                },
                example: [
                  {
                    id: '1',
                    name: 'Eletrodomésticos',
                    submenus: [
                      {
                        id: '2',
                        name: 'Televisores',
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
    '/api/v1/menu/{id}': {
      delete: {
        tags: ['Menu'],
        summary: 'Exclui um item e seus descendentes',
        description:
          'A exclusão remove o item informado e toda a sua árvore de submenus.',
        operationId: 'deleteMenuItem',
        parameters: [
          {
            $ref: '#/components/parameters/MenuItemId',
          },
        ],
        responses: {
          '200': {
            description: 'Item excluído',
          },
          '400': {
            $ref: '#/components/responses/InvalidId',
          },
          '404': {
            $ref: '#/components/responses/ItemNotFound',
          },
        },
      },
    },
  },
  components: {
    parameters: {
      MenuItemId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Identificador numérico do item',
        schema: {
          type: 'integer',
          format: 'int64',
          minimum: 1,
        },
        example: 1,
      },
    },
    responses: {
      InvalidRequest: {
        description: 'Corpo da requisição inválido',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
      InvalidId: {
        description: 'Identificador inválido',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
      ParentNotFound: {
        description: 'Item pai não encontrado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
      ItemNotFound: {
        description: 'Item não encontrado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
      NameConflict: {
        description: 'Nome já cadastrado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
          },
        },
      },
    },
    schemas: {
      CreateMenuItemRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'Nome único do item de menu',
            example: 'Televisores',
          },
          relatedId: {
            type: 'integer',
            format: 'int64',
            minimum: 1,
            description: 'ID numérico do item pai, quando aplicável',
            example: 1,
          },
        },
      },
      CreateMenuItemResponse: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'ID do item criado',
            example: '1',
          },
        },
      },
      MenuNode: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'string',
            example: '1',
          },
          name: {
            type: 'string',
            example: 'Eletrodomésticos',
          },
          submenus: {
            type: 'array',
            description: 'Submenus do item; omitido quando o item não possui filhos',
            items: {
              $ref: '#/components/schemas/MenuNode',
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            example: 'Menu item 999 was not found',
          },
          details: {
            type: 'array',
            description: 'Detalhes de validação, quando aplicável',
            items: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['ok'],
          },
        },
      },
    },
  },
} as const
