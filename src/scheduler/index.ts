import cron from 'node-cron';
import { refreshTokens } from './tasks/refreshTokens';
import { TOKEN_REFRESH_SETTINGS } from '../config';

const startScheduler = async () => {
  await refreshTokens();
  cron.schedule(TOKEN_REFRESH_SETTINGS.updateInterval, refreshTokens).start();
  console.log(`Started token refresh schedule for ${TOKEN_REFRESH_SETTINGS.updateInterval}`);
};

startScheduler();