import { z } from 'zod'

export interface AppConfig {
  port: number
  mongodbUri: string
  mongodbDatabase: string
  mongodbServerSelectionTimeoutMs: number
}

const positiveInteger = z.coerce.number().int().positive()

const environmentSchema = z.object({
  port: positiveInteger.default(3000),
  mongodbUri: z.string().min(1).default('mongodb://localhost:27017'),
  mongodbDatabase: z.string().min(1).default('menu_api'),
  mongodbServerSelectionTimeoutMs: positiveInteger.default(5000),
})

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = environmentSchema.safeParse({
    port: env.PORT,
    mongodbUri: env.MONGODB_URI,
    mongodbDatabase: env.MONGODB_DB_NAME,
    mongodbServerSelectionTimeoutMs: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
  })

  if (!result.success) {
    const details = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid environment configuration: ${details}`)
  }

  return result.data
}
