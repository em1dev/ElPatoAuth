import 'dotenv/config';

export const Config = process.env as {
  PORT: string,
  ENCRYPTION_KEY: string,
  TOKEN_ISSUER: string,
  SQLITE_DB_PATH: string,
  REDIS_URL: string
};

if (
  !Config.PORT ||
  !Config.ENCRYPTION_KEY ||
  !Config.SQLITE_DB_PATH ||
  !Config.TOKEN_ISSUER ||
  !Config.REDIS_URL
){
  throw new Error('Missing env variables');
}

export const TOKEN_REFRESH_SETTINGS = {
  // https://cron.help/#*/10_*_*_*_*
  updateInterval: '*/10 * * * *', // every 10 minutes
  updateThreshold: 1800 // 30 minutes before expiry
};
