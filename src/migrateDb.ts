import { db } from './repository/db';
import { MigrationRunner } from './repository/db/migrations';

(async () => {
  const migrationRunner = new MigrationRunner(db);
  console.log('Migration started...');
  await migrationRunner.run();
  console.log('Completed');
})();