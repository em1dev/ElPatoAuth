import { Database } from "..";

export class MigrationRunner {

  private _db: Database;

  constructor(database: Database) {
    this._db = database;
  }

  public run = async () => {
    await this.createTables();
  }

  private createTables = async () => {
    await this._db.run(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app TEXT NOT NULL
      );
    `);

    await this._db.run(`
      CREATE TABLE IF NOT EXISTS connection (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        fk_user_id INTEGER NOT NULL,
        FOREIGN KEY(fk_user_id) REFERENCES user(id)
      );
    `);

    await this._db.run(`
      CREATE TABLE IF NOT EXISTS provider (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        user_login TEXT NOT NULL,
        type TEXT NOT NULL,
        fk_user_id INTEGER NOT NULL,
        FOREIGN KEY(fk_user_id) REFERENCES user(id)
      );
    `);
  }
}