import { MenuItemNotFoundError } from '../errors'
import { MenuItemRepository } from '../ports/menu-item-repository'

export class DeleteMenuItemUseCase {
  constructor(private readonly repository: MenuItemRepository) {}

  async execute(id: number): Promise<void> {
    if (!(await this.repository.findById(id))) {
      throw new MenuItemNotFoundError(id)
    }

    await this.repository.deleteTree(id)
  }
}
