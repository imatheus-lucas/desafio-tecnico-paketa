import { MenuItem } from '../../domain/menu-item'
import { MenuItemNameAlreadyExistsError, ParentMenuItemNotFoundError } from '../errors'
import { IdGenerator } from '../ports/id-generator'
import { MenuItemRepository } from '../ports/menu-item-repository'

export interface CreateMenuItemInput {
  name: string
  relatedId?: number
}

export class CreateMenuItemUseCase {
  constructor(
    private readonly repository: MenuItemRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateMenuItemInput): Promise<MenuItem> {
    if (input.relatedId !== undefined) {
      const parent = await this.repository.findById(input.relatedId)
      if (!parent) {
        throw new ParentMenuItemNotFoundError(input.relatedId)
      }
    }

    const nameAlreadyExists = await this.repository.existsByName(input.name)

    if (nameAlreadyExists) {
      throw new MenuItemNameAlreadyExistsError()
    }

    const item: MenuItem = {
      id: await this.idGenerator.next(),
      name: input.name,
      relatedId: input.relatedId,
    }

    await this.repository.create(item)
    return item
  }
}
