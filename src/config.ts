import 'dotenv/config';

export const Config = process.env as {
  TWITCH_SECRET:string
  TWITCH_CLIENT_ID:string
  PORT:string,
};

if (!Config.PORT || !Config.TWITCH_CLIENT_ID || !Config.TWITCH_SECRET){
  throw new Error('Missing env variables');
}