import crypto from 'crypto';
import { Config } from '../config';

const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY = Config.ENCRYPTION_KEY;

export const encrypt = (value: string) => {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(SECRET_KEY, 'utf-8');
  const cipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  const encryptedString = cipher.update(value, 'utf-8', 'hex') + cipher.final('hex');
  return `${encryptedString}_${iv.toString('hex')}`
};

export const decrypt = (value: string) => {
  const [encryptedString, iv] = value.split('_');

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, 'hex'));
  const decipherValue = decipher.update(encryptedString, 'hex', 'utf-8') + decipher.final('utf-8');
  return decipherValue;
}