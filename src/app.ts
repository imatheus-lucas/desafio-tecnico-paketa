import express from 'express'
import { MenuController } from './http/menu-controller'
import { errorHandler, notFoundHandler } from './http/errors'

export function createApp(menuController: MenuController) {
  const app = express()

  app.disable('x-powered-by')

  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
    })
  })

  const menuRouter = express.Router()
  menuController.register(menuRouter)
  app.use('/api/v1/menu', menuRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
