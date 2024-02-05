import sqlite3 from "sqlite3";

export class Database {

  private client: sqlite3.Database;

  constructor(path: string, verbose: boolean = false) {
    if (verbose) { sqlite3.verbose() };

    this.client = new sqlite3.Database(path, (err => {
      if (err) {
        console.log('Error loading db: ', err);
      }
    }));
  }

  public run = (sql: string) => (
    new Promise<void>((resolve, reject) => {
      this.client.run(sql, (err) => {
        err ? reject(err) : resolve();
      });
    })
  );

  public get = <T>(sql: string, params?: any) => (
    new Promise<T>((resolve, reject) => {
      this.client.get(sql, params, (err, data) => {
        err ? reject(err) : resolve(data as T)
      })
    })
  );

  public all = <T>(sql: string, params?: any) => (
    new Promise<Array<T>>((resolve, reject) => {
      this.client.all(sql, params, (err, data) => {
        err ? reject(err) : resolve(data as Array<T>)
      })
    })
  );
}

