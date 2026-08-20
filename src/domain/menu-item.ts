export interface MenuItem {
  id: number
  name: string
  relatedId?: number
}

export interface MenuNode {
  id: string
  name: string
  submenus?: MenuNode[]
}
