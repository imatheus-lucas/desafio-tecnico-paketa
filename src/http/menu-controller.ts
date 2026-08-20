import { NextFunction, Request, Response, Router } from 'express'
import { z } from 'zod'
import { ApplicationError } from '../application/errors'
import {
  CreateMenuItemInput,
  CreateMenuItemUseCase,
} from '../application/use-cases/create-menu-item'
import { DeleteMenuItemUseCase } from '../application/use-cases/delete-menu-item'
import { GetMenuUseCase } from '../application/use-cases/get-menu'

const createMenuItemSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    relatedId: z.number().int().positive().optional(),
  })
  .strict()

export interface MenuControllerDependencies {
  createMenuItem: CreateMenuItemUseCase
  deleteMenuItem: DeleteMenuItemUseCase
  getMenu: GetMenuUseCase
}

export class MenuController {
  constructor(private readonly dependencies: MenuControllerDependencies) {}

  register(router: Router): void {
    router.post('/', this.create.bind(this))
    router.delete('/:id', this.delete.bind(this))
    router.get('/', this.get.bind(this))
  }

  private async create(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input: CreateMenuItemInput = createMenuItemSchema.parse(request.body)
      const item = await this.dependencies.createMenuItem.execute(input)

      response.status(201).json({ id: String(item.id) })
    } catch (error) {
      next(error)
    }
  }

  private async delete(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = parseMenuItemId(request.params.id)
      await this.dependencies.deleteMenuItem.execute(id)
      response.status(200).send()
    } catch (error) {
      next(error)
    }
  }

  private async get(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response.status(200).json(await this.dependencies.getMenu.execute())
    } catch (error) {
      next(error)
    }
  }
}

function parseMenuItemId(value: string | string[]): number {
  if (Array.isArray(value)) {
    throw new InvalidMenuItemIdError()
  }

  if (!/^\d+$/.test(value)) {
    throw new InvalidMenuItemIdError()
  }

  const id = Number(value)

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new InvalidMenuItemIdError()
  }

  return id
}

export class InvalidMenuItemIdError extends ApplicationError {
  readonly code = 'INVALID_MENU_ITEM_ID'

  constructor() {
    super('The menu item id must be a positive integer', 400)
  }
}
