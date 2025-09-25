import { Database } from '..';
import { createTables } from './01_init';
import { Migration } from './types';

export class MigrationRunner {
  private _migrations: Array<Migration> = [
    createTables
  ];

  private _db: Database;

  constructor(database: Database) {
    this._db = database;
  }

  public run = async () => {
    await this.addMigrationTable();
    const toRun = await this.getMigrationsToRun();
    console.log(`${toRun.length} migrations to run`);
    for (const migration of toRun) {
      console.log(`Running migration: ${migration.id}`);
      await migration.command(this._db);
      await this.addMigrationToMigrationTable(migration.id);
      console.log(`Finished running migration: ${migration.id}`);
    }
  };

  private addMigrationToMigrationTable = async (id: string) => await this._db.run(`
    INSERT INTO migrations (id, executed_at)
    VALUES ($id, datetime('now'))
  `, { $id: id});

  private addMigrationTable = async () => await this._db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      executed_at DATETIME NOT NULL
    );
  `);

  private getMigrationsToRun = async () => {
    const migrationsAlreadyExecuted = await this._db.all<{ id: string }>('SELECT * FROM migrations');
    const leftToRun = this._migrations.filter(m => !migrationsAlreadyExecuted.find(migrationAlreadyExecuted => migrationAlreadyExecuted.id === m.id));
    return leftToRun;
  };
}