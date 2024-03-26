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