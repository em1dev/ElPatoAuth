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
  // At the start of every 5th hour from 12am through 11pm
  // https://cron.help/#0_0/5_*_*_*
  updateInterval: '0 0/5 * * *', // every 5 hours
  updateThreshold: 21600000 // 6 hours before expires
};