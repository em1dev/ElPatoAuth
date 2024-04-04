import 'dotenv/config';

export const Config = process.env as {
  PORT:string,
  ENCRYPTION_KEY: string,
};

if (
  !Config.PORT ||
  !Config.ENCRYPTION_KEY
){
  throw new Error('Missing env variables');
}


export const TOKEN_REFRESH_SETTINGS = {
  // At the start of every 1th hour from 12am through 11pm
  // https://cron.help/#0_0/1_*_*_*
  updateInterval: '0 * * * *', // every 1 hours
  updateThreshold: 7200000 // 2 hours before expires
};