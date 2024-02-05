import { Database } from "./Database";

export const db = new Database('./db.db');

(async () => {
  await db.run("CREATE TABLE user (name TEXT)");
  console.log(await db.all('SELECT name FROM user'));
})()
