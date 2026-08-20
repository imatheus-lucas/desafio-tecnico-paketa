export interface IdGenerator {
  next(): Promise<number>
}
