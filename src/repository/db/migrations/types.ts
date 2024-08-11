import { Database } from '..';

export interface Migration {
  id: string,
  command: (db: Database) => Promise<void>,
}