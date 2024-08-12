import crypto from 'crypto';


const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(32).toString('hex');
  const genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${genHash}_${salt}`;
};

const verifyPassword = (encryptedPassword: string, passwordToCompare: string) => {
  const [hash, salt] = encryptedPassword.split('_');

  const hashToCompare = crypto.pbkdf2Sync(passwordToCompare, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashToCompare));
};

export const PasswordHasher = {
  hashPassword,
  verifyPassword
};