import cron from 'node-cron';
import { refreshTokens } from './tasks/refreshTokens';
import { TOKEN_REFRESH_SETTINGS } from '../config';

const startScheduler = async () => {
  const isValidExpression = cron.validate(TOKEN_REFRESH_SETTINGS.updateInterval);
  if (!isValidExpression) throw new Error('Invalid cron expression');

  console.log(`Started token refresh schedule for ${TOKEN_REFRESH_SETTINGS.updateInterval}`);
  const task = cron.schedule(TOKEN_REFRESH_SETTINGS.updateInterval, refreshTokens, {
    noOverlap: true
  });
  await task.execute(); // run now
};

startScheduler();