import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadConfig } from '../src/infra/config/env'

describe('environment configuration', () => {
  it('uses safe defaults when optional variables are absent', () => {
    assert.deepEqual(loadConfig({}), {
      port: 3000,
      mongodbUri: 'mongodb://localhost:27017',
      mongodbDatabase: 'menu_api',
      mongodbServerSelectionTimeoutMs: 5000,
    })
  })

  it('coerces numeric environment variables', () => {
    assert.deepEqual(
      loadConfig({
        PORT: '8080',
        MONGODB_URI: 'mongodb://db:27017',
        MONGODB_DB_NAME: 'menu_api_dev',
        MONGODB_SERVER_SELECTION_TIMEOUT_MS: '10000',
      }),
      {
        port: 8080,
        mongodbUri: 'mongodb://db:27017',
        mongodbDatabase: 'menu_api_dev',
        mongodbServerSelectionTimeoutMs: 10000,
      },
    )
  })

  it('rejects non-positive numeric environment variables', () => {
    assert.throws(
      () => loadConfig({ PORT: '0' }),
      /Invalid environment configuration: port:/,
    )
  })
})
