import { Database } from '..';

export class MigrationRunner {

  private _db: Database;

  constructor(database: Database) {
    this._db = database;
  }

  public run = async () => {
    await this.createTables();
  };

  private createTables = async () => {
    // EXTERNAL SERVICE
    await this._db.run(`
      CREATE TABLE IF NOT EXISTS externalService (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        client_secret TEXT NOT NULL,
        client_id TEXT NOT NULL,
        fk_app_id TEXT NOT NULL,
        FOREIGN KEY(fk_app_id) REFERENCES app(id)
      );
    `);

    // APP
    await this._db.run(`
      CREATE TABLE IF NOT EXISTS app (
        id TEXT PRIMARY KEY
      );
    `);

    // USER
    await this._db.run(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fk_app_id TEXT NOT NULL,
        FOREIGN KEY(fk_app_id) REFERENCES app(id)
      );
    `);

    // CONNECTION
    await this._db.run(`
      CREATE TABLE IF NOT EXISTS connection (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at NUMBER NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        fk_user_id INTEGER NOT NULL,
        FOREIGN KEY(fk_user_id) REFERENCES user(id)
      );
    `);

    // LOGIN PROVIDER
    await this._db.run(`
      CREATE TABLE IF NOT EXISTS loginProvider (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        user_login TEXT NOT NULL,
        type TEXT NOT NULL,
        fk_user_id INTEGER NOT NULL,
        FOREIGN KEY(fk_user_id) REFERENCES user(id)
      );
    `);
  };
}