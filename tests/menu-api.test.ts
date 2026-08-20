import assert from 'node:assert/strict'
import { createServer, Server } from 'node:http'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { createApp } from '../src/app'
import { MenuItemRepository } from '../src/application/ports/menu-item-repository'
import { IdGenerator } from '../src/application/ports/id-generator'
import { MenuItemNameAlreadyExistsError } from '../src/application/errors'
import { CreateMenuItemUseCase } from '../src/application/use-cases/create-menu-item'
import { DeleteMenuItemUseCase } from '../src/application/use-cases/delete-menu-item'
import { buildMenuTree, GetMenuUseCase } from '../src/application/use-cases/get-menu'
import { MenuItem } from '../src/domain/menu-item'
import { MenuController } from '../src/http/menu-controller'

let baseUrl: string

class InMemoryMenuItemRepository implements MenuItemRepository {
  private readonly items = new Map<number, MenuItem>()

  async create(item: MenuItem): Promise<void> {
    if ([...this.items.values()].some(existing => existing.name === item.name)) {
      throw new MenuItemNameAlreadyExistsError()
    }

    this.items.set(item.id, item)
  }

  async existsByName(name: string): Promise<boolean> {
    return [...this.items.values()].some(item => item.name === name)
  }

  async findById(id: number): Promise<MenuItem | null> {
    return this.items.get(id) ?? null
  }

  async findAll(): Promise<MenuItem[]> {
    return [...this.items.values()].sort((left, right) => left.id - right.id)
  }

  async deleteTree(id: number): Promise<void> {
    const items = await this.findAll()
    const idsToDelete = new Set([id])
    let changed = true

    while (changed) {
      changed = false

      for (const item of items) {
        if (
          item.relatedId !== undefined &&
          idsToDelete.has(item.relatedId) &&
          !idsToDelete.has(item.id)
        ) {
          idsToDelete.add(item.id)
          changed = true
        }
      }
    }

    for (const itemId of idsToDelete) {
      this.items.delete(itemId)
    }
  }
}

class SequentialIdGenerator implements IdGenerator {
  private current = 0

  async next(): Promise<number> {
    this.current += 1
    return this.current
  }
}

describe('menu API', () => {
  let server: Server

  beforeEach(async () => {
    const repository = new InMemoryMenuItemRepository()
    const idGenerator = new SequentialIdGenerator()
    const app = createApp(
      new MenuController({
        createMenuItem: new CreateMenuItemUseCase(repository, idGenerator),
        deleteMenuItem: new DeleteMenuItemUseCase(repository),
        getMenu: new GetMenuUseCase(repository),
      }),
    )

    server = createServer(app)
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', () => resolve())
    })

    const address = server.address()
    assert(address && typeof address !== 'string')
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  afterEach(async () => {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()))
    })
  })

  it('creates items and returns the complete infinitely nested menu', async () => {
    const root = await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'Eletrodomésticos' }),
    })
    const television = await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'Televisores', relatedId: 1 }),
    })
    await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCD', relatedId: 2 }),
    })
    await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: '110', relatedId: 3 }),
    })

    assert.equal(root.status, 201)
    assert.deepEqual(root.body, { id: '1' })
    assert.equal(television.status, 201)

    const menu = await request('/api/v1/menu')

    assert.equal(menu.status, 200)
    assert.deepEqual(menu.body, [
      {
        id: '1',
        name: 'Eletrodomésticos',
        submenus: [
          {
            id: '2',
            name: 'Televisores',
            submenus: [
              {
                id: '3',
                name: 'LCD',
                submenus: [{ id: '4', name: '110' }],
              },
            ],
          },
        ],
      },
    ])
  })

  it('serves the OpenAPI document and Swagger UI', async () => {
    const document = await request('/docs.json')
    const swaggerUiResponse = await fetch(`${baseUrl}/docs`)

    assert.equal(document.status, 200)
    assert.equal((document.body as { openapi: string }).openapi, '3.0.3')
    assert.ok((document.body as { paths: Record<string, unknown> }).paths['/api/v1/menu'])
    assert.equal(swaggerUiResponse.status, 200)
    assert.match(await swaggerUiResponse.text(), /Swagger UI/)
  })

  it('rejects duplicate names and a missing parent', async () => {
    const first = await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'Informática' }),
    })
    const duplicate = await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'Informática' }),
    })
    const missingParent = await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'Computadores', relatedId: 999 }),
    })

    assert.equal(first.status, 201)
    assert.equal(duplicate.status, 409)
    assert.equal(missingParent.status, 404)
  })

  it('deletes an item and its descendants', async () => {
    await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'Informática' }),
    })
    await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'Computadores', relatedId: 1 }),
    })
    await request('/api/v1/menu', {
      method: 'POST',
      body: JSON.stringify({ name: 'Apple', relatedId: 2 }),
    })

    const deleted = await request('/api/v1/menu/1', { method: 'DELETE' })
    const menu = await request('/api/v1/menu')

    assert.equal(deleted.status, 200)
    assert.deepEqual(menu.body, [])
  })

  it('builds a very deep hierarchy without using the call stack', () => {
    const items = Array.from({ length: 10_000 }, (_, index) => ({
      id: index + 1,
      name: `Item ${index + 1}`,
      ...(index === 0 ? {} : { relatedId: index }),
    }))

    const menu = buildMenuTree(items)
    let current = menu[0]

    for (let index = 1; index < items.length; index += 1) {
      const next = current.submenus?.[0]
      assert(next)
      current = next
    }

    assert.equal(current.id, '10000')
  })
})

async function request(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await response.text()

  return {
    status: response.status,
    body: text ? JSON.parse(text) : undefined,
  }
}
