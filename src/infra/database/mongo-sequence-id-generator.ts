import { Collection, Document, ReturnDocument } from 'mongodb'
import { IdGenerator } from '../../application/ports/id-generator'

interface CounterDocument extends Document {
  _id: string
  value: number
}

export class MongoSequenceIdGenerator implements IdGenerator {
  constructor(
    private readonly collection: Collection<CounterDocument>,
    private readonly sequenceName = 'menu_item',
  ) {}

  async next(): Promise<number> {
    const counter = await this.collection.findOneAndUpdate(
      { _id: this.sequenceName },
      { $inc: { value: 1 } },
      {
        upsert: true,
        returnDocument: ReturnDocument.AFTER,
      },
    )

    if (!counter) {
      throw new Error('Could not generate a menu item id')
    }

    return counter.value
  }
}
