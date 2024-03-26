import { KeyLike, generateKeyPair, SignJWT, jwtVerify } from 'jose';
import { InternalError } from '../errors';
import { TokenUser } from './tokenUser';

const ISSUER = 'ElPato.Auth';

export const keyStore: {
  publicKey: null | KeyLike,
  privateKey: null | KeyLike
} = {
  publicKey: null,
  privateKey: null 
};

const keyGeneration = async () => {
  const { privateKey, publicKey } = await generateKeyPair('PS256', { extractable: true });
  console.log('generating keys');
  keyStore.privateKey = privateKey;
  keyStore.publicKey = publicKey;
};

keyGeneration();

export const createToken = async (user: TokenUser) => {
  if (!keyStore.privateKey || !keyStore.publicKey) {
    throw new InternalError('keys not generated yet');
  }

  const jwt = await new SignJWT({
    ...user
  })
    .setProtectedHeader({
      alg: 'PS256'
    })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience('ElPato.Apps')
    .setExpirationTime('1week')
    .sign(keyStore.privateKey);

  return jwt;
};

export const verifyToken = async (token: string) => {
  if (!keyStore.privateKey || !keyStore.publicKey) {
    throw new InternalError('keys not generated yet');
  }

  try {
    const payload = await jwtVerify(token, keyStore.publicKey, { issuer: ISSUER });
    return payload.payload;
  } catch {
    return null;
  }
};