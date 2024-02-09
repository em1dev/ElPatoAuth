import 'dotenv/config';

export const Config = process.env as {
  TWITCH_SECRET:string
  TWITCH_CLIENT_ID:string
  PORT:string,
  ENCRYPTION_KEY: string,
  TIKTOK_SECRET: string,
  TIKTOK_CLIENT_KEY: string,
  TIKTOK_APP_ID: string,
};

if (
  !Config.PORT ||
  !Config.TWITCH_CLIENT_ID ||
  !Config.TWITCH_SECRET ||
  !Config.ENCRYPTION_KEY ||
  !Config.TIKTOK_APP_ID ||
  !Config.TIKTOK_CLIENT_KEY ||
  !Config.TIKTOK_SECRET
  ){
  throw new Error('Missing env variables');
}