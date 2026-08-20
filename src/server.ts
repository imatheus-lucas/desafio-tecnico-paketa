import { createApp } from './app'
import { CreateMenuItemUseCase } from './application/use-cases/create-menu-item'
import { DeleteMenuItemUseCase } from './application/use-cases/delete-menu-item'
import { GetMenuUseCase } from './application/use-cases/get-menu'
import { loadConfig } from './infra/config/env'
import { createMongoRuntime } from './infra/database/mongo-runtime'
import { MenuController } from './http/menu-controller'

async function bootstrap(): Promise<void> {
  const config = loadConfig()
  const mongo = createMongoRuntime(config)
  await mongo.connect()

  const menuController = new MenuController({
    createMenuItem: new CreateMenuItemUseCase(mongo.repository, mongo.idGenerator),
    deleteMenuItem: new DeleteMenuItemUseCase(mongo.repository),
    getMenu: new GetMenuUseCase(mongo.repository),
  })
  const app = createApp(menuController)
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down`)
    server.close(async () => {
      await mongo.close()
      process.exit(0)
    })
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
}

bootstrap().catch(error => {
  console.error('Could not start server', error)
  process.exitCode = 1
})
