import { Collection, Db, Document, MongoServerError } from 'mongodb'
import { MenuItemNameAlreadyExistsError } from '../../application/errors'
import { MenuItemRepository } from '../../application/ports/menu-item-repository'
import { MenuItem } from '../../domain/menu-item'

interface MenuItemDocument extends Document {
  id: number
  name: string
  relatedId?: number
}

interface DescendantQueryResult {
  id: number
  descendants: Array<{ id: number }>
}

export class MongoMenuItemRepository implements MenuItemRepository {
  constructor(private readonly collection: Collection<MenuItemDocument>) {}

  static fromDatabase(db: Db): MongoMenuItemRepository {
    return new MongoMenuItemRepository(db.collection<MenuItemDocument>('menu_items'))
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex(
      { id: 1 },
      { unique: true, name: 'menu_items_id_unique' },
    )
    await this.collection.createIndex(
      { name: 1 },
      { unique: true, name: 'menu_items_name_unique' },
    )
    await this.collection.createIndex({ relatedId: 1 }, { name: 'menu_items_related_id' })
  }

  async create(item: MenuItem): Promise<void> {
    try {
      await this.collection.insertOne(item)
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000 &&
        error.keyPattern?.name === 1
      ) {
        throw new MenuItemNameAlreadyExistsError()
      }

      throw error
    }
  }

  async existsByName(name: string): Promise<boolean> {
    return Boolean(await this.collection.findOne({ name }, { projection: { _id: 1 } }))
  }

  async findById(id: number): Promise<MenuItem | null> {
    const item = await this.collection.findOne({ id }, { projection: { _id: 0 } })

    return item ? toDomain(item) : null
  }

  async findAll(): Promise<MenuItem[]> {
    const items = await this.collection
      .find({}, { projection: { _id: 0 } })
      .sort({ id: 1 })
      .toArray()

    return items.map(toDomain)
  }

  async deleteTree(id: number): Promise<void> {
    const result = await this.collection
      .aggregate<DescendantQueryResult>([
        { $match: { id } },
        {
          $graphLookup: {
            from: this.collection.collectionName,
            startWith: '$id',
            connectFromField: 'id',
            connectToField: 'relatedId',
            as: 'descendants',
          },
        },
        { $project: { _id: 0, id: 1, 'descendants.id': 1 } },
      ])
      .next()

    if (!result) {
      return
    }

    const ids = [result.id, ...result.descendants.map(descendant => descendant.id)]
    await this.collection.deleteMany({ id: { $in: ids } })
  }
}

function toDomain(document: MenuItemDocument): MenuItem {
  return {
    id: document.id,
    name: document.name,
    ...(document.relatedId === undefined ? {} : { relatedId: document.relatedId }),
  }
}
