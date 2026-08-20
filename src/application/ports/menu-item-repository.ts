import { MenuItem } from '../../domain/menu-item'

export interface MenuItemRepository {
  create(item: MenuItem): Promise<void>
  existsByName(name: string): Promise<boolean>
  findById(id: number): Promise<MenuItem | null>
  findAll(): Promise<MenuItem[]>
  deleteTree(id: number): Promise<void>
}
