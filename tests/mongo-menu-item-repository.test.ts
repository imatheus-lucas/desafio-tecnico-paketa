import { MongoClient } from 'mongodb'
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { MenuItemNameAlreadyExistsError } from '../src/application/errors'
import { MongoMenuItemRepository } from '../src/infra/database/mongo-menu-item-repository'
import { MongoSequenceIdGenerator } from '../src/infra/database/mongo-sequence-id-generator'

const runMongoTests = process.env.RUN_MONGO_TESTS === '1'

describe('MongoDB repository', { skip: !runMongoTests }, () => {
  let client: MongoClient
  let repository: MongoMenuItemRepository
  let databaseName: string

  before(async () => {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
    databaseName = process.env.MONGODB_DB_NAME ?? 'menu_api_test'
    client = new MongoClient(uri)
    await client.connect()
    const database = client.db(databaseName)
    await database.dropDatabase()
    repository = MongoMenuItemRepository.fromDatabase(database)
    await repository.ensureIndexes()
  })

  after(async () => {
    await client.db(databaseName).dropDatabase()
    await client.close()
  })

  it('persists independent documents and deletes an entire descendant tree', async () => {
    const database = client.db(databaseName)
    const idGenerator = new MongoSequenceIdGenerator(database.collection('counters'))
    const root = { id: await idGenerator.next(), name: 'Informática' }
    const child = {
      id: await idGenerator.next(),
      name: 'Computadores',
      relatedId: root.id,
    }
    const grandchild = {
      id: await idGenerator.next(),
      name: 'Apple',
      relatedId: child.id,
    }

    await repository.create(root)
    await repository.create(child)
    await repository.create(grandchild)
    assert.equal((await repository.findAll()).length, 3)

    await repository.deleteTree(root.id)

    assert.deepEqual(await repository.findAll(), [])
  })

  it('enforces the unique name index', async () => {
    await repository.create({ id: 10, name: 'Eletrodomésticos' })

    await assert.rejects(
      repository.create({ id: 11, name: 'Eletrodomésticos' }),
      MenuItemNameAlreadyExistsError,
    )
  })
})
