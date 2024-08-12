import { Migration } from './types';

export const addIsAdminColumn:Migration = {
  id: '02_addIsAdminColumn',
  command: async (db) => {
    const result = await db.get<{ exists: number }>(`
      SELECT COUNT(*) AS 'exists' FROM pragma_table_info("user") WHERE name = 'isAdmin';
    `);

    if (result?.exists === 1) return;

    await db.run(`
        ALTER TABLE user 
        ADD COLUMN isAdmin BOOLEAN NOT NULL DEFAULT FALSE;
      ;
    `);
  },
};