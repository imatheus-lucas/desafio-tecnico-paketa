# Desafio técnico - Menu API

API para gestão de itens de menu hierárquicos, desenvolvida com Node.js, TypeScript, Express e MongoDB.

## Executando localmente

```bash
npm install
npm run dev
```

As configurações padrão estão documentadas em `.env.example`. Para personalizá-las, copie o arquivo para `.env`:

```bash
cp .env.example .env
```

Os comandos Node carregam primeiro `.env.example` com `--env-file` e, quando existir, aplicam os valores de `.env` com `--env-file-if-exists`. A API espera, por padrão, o MongoDB em `mongodb://localhost:27017`, usa o banco `menu_api` e escuta na porta `3000`.

A documentação interativa está disponível em `http://localhost:3000/docs` e o documento OpenAPI em `http://localhost:3000/docs.json`.

Com Docker Compose:

```bash
docker compose up --build
```

## Endpoints

### Criar item

`POST /api/v1/menu`

```json
{ "name": "Televisores", "relatedId": 1 }
```

`relatedId` é opcional. O retorno é `201` com o identificador do item:

```json
{ "id": "2" }
```

### Excluir item

`DELETE /api/v1/menu/:id`

Retorna `200`. A exclusão de um item remove também todos os seus descendentes para não deixar referências órfãs.

### Consultar menu

`GET /api/v1/menu`

Retorna `200` com as raízes e os submenus aninhados. Itens sem filhos não recebem uma propriedade `submenus`.

## Testes

```bash
npm test
npm run typecheck
npm run build
docker compose -f docker-compose.test.yml run --rm api-test
```

O código é organizado por domínio, casos de uso, portas, infraestrutura e transporte HTTP. O MongoDB mantém cada item em um documento próprio, com índices únicos para `id` e `name` e índice de busca por `relatedId`.
