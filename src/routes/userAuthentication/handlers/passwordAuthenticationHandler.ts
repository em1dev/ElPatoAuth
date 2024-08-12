import { PasswordHasher } from '../../../encryption/hasher';
import { NotFoundError, UnauthorizedError } from '../../../errors';
import { createToken } from '../../../jwtService';
import { getApp } from '../../../repository/appRepository';
import { getUserByCredentials } from '../../../repository/userRepository';

export const passwordAuthenticationHandler = async (
  email: string,
  password: string,
  appId: string
) => {

  const app = await getApp(appId);
  if (!app) throw new NotFoundError(`Application with id ${appId} not found`);

  const user = await getUserByCredentials(appId, email);
  if (!user) throw new NotFoundError(`User with email ${email} not found`);

  const isValid = PasswordHasher.verifyPassword(user.encryptedPassword, password);
  if (!isValid) throw new UnauthorizedError('Invalid password');

  return createToken({
    app: appId,
    id: user.id,
  }, appId);
};