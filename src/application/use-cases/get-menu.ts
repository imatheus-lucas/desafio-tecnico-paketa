import { MenuItem, MenuNode } from '../../domain/menu-item'
import { MenuItemRepository } from '../ports/menu-item-repository'

interface MutableMenuNode extends MenuNode {
  submenus: MutableMenuNode[]
}

export class GetMenuUseCase {
  constructor(private readonly repository: MenuItemRepository) {}

  async execute(): Promise<MenuNode[]> {
    const items = await this.repository.findAll()
    return buildMenuTree(items)
  }
}

export function buildMenuTree(items: MenuItem[]): MenuNode[] {
  const nodes = new Map<number, MutableMenuNode>()

  for (const item of items) {
    nodes.set(item.id, {
      id: String(item.id),
      name: item.name,
      submenus: [],
    })
  }

  const roots: MutableMenuNode[] = []

  for (const item of items) {
    const node = nodes.get(item.id)

    if (!node) {
      continue
    }

    if (item.relatedId === undefined || !nodes.has(item.relatedId)) {
      roots.push(node)
      continue
    }

    nodes.get(item.relatedId)?.submenus.push(node)
  }

  return roots.map(stripEmptySubmenus)
}

function stripEmptySubmenus(node: MutableMenuNode): MenuNode {
  const converted = new Map<MutableMenuNode, MenuNode>()
  const stack: Array<{ node: MutableMenuNode; expanded: boolean }> = [
    { node, expanded: false },
  ]

  while (stack.length > 0) {
    const current = stack.pop()

    if (!current) {
      continue
    }

    if (!current.expanded) {
      stack.push({ node: current.node, expanded: true })

      for (let index = current.node.submenus.length - 1; index >= 0; index -= 1) {
        stack.push({ node: current.node.submenus[index], expanded: false })
      }

      continue
    }

    const submenus = current.node.submenus.map(child => converted.get(child)!)
    converted.set(
      current.node,
      submenus.length > 0
        ? { id: current.node.id, name: current.node.name, submenus }
        : { id: current.node.id, name: current.node.name },
    )
  }

  return converted.get(node)!
}
