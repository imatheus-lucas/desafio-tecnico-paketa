export type ApplicationErrorCode =
  | 'MENU_ITEM_NAME_ALREADY_EXISTS'
  | 'MENU_ITEM_NOT_FOUND'
  | 'PARENT_MENU_ITEM_NOT_FOUND'
  | 'INVALID_MENU_ITEM_ID'

export abstract class ApplicationError extends Error {
  abstract readonly code: ApplicationErrorCode
  readonly statusCode: number

  protected constructor(message: string, statusCode: number) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
  }
}

export class MenuItemNameAlreadyExistsError extends ApplicationError {
  readonly code = 'MENU_ITEM_NAME_ALREADY_EXISTS'

  constructor() {
    super('A menu item with this name already exists', 409)
  }
}

export class MenuItemNotFoundError extends ApplicationError {
  readonly code = 'MENU_ITEM_NOT_FOUND'

  constructor(id: number) {
    super(`Menu item ${id} was not found`, 404)
  }
}

export class ParentMenuItemNotFoundError extends ApplicationError {
  readonly code = 'PARENT_MENU_ITEM_NOT_FOUND'

  constructor(id: number) {
    super(`Parent menu item ${id} was not found`, 404)
  }
}
