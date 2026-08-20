import { MongoClient } from 'mongodb'
import { AppConfig } from '../config/env'
import { MongoMenuItemRepository } from './mongo-menu-item-repository'
import { MongoSequenceIdGenerator } from './mongo-sequence-id-generator'

export function createMongoRuntime(config: AppConfig) {
  const client = new MongoClient(config.mongodbUri, {
    serverSelectionTimeoutMS: config.mongodbServerSelectionTimeoutMs,
  })
  const db = client.db(config.mongodbDatabase)
  const repository = MongoMenuItemRepository.fromDatabase(db)
  const idGenerator = new MongoSequenceIdGenerator(db.collection('counters'))

  return {
    client,
    repository,
    idGenerator,
    async connect() {
      await client.connect()
      await repository.ensureIndexes()
    },
    async close() {
      await client.close()
    },
  }
}
