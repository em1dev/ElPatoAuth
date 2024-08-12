import { Database } from '..';
import { Migration } from './types';

export const addPasswordProviderTable:Migration = {
  id: '03_addPasswordProviderTable',
  command: async (db: Database) => {
    await db.run(`
      CREATE TABLE IF NOT EXISTS passwordProvider (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        password_encrypted TEXT NOT NULL
      );
    `);

    const result = await db.get<{ exists: number }>(`
      SELECT COUNT(*) AS 'exists' FROM pragma_table_info("user") WHERE name = 'fk_password_provider_id';
    `);

    if (result?.exists === 0) {
      // does not add a constraint
      await db.run(`
        ALTER TABLE user
        ADD COLUMN fk_password_provider_id INTEGER REFERENCES passwordProvider(id);
      `);
    }

  }
};