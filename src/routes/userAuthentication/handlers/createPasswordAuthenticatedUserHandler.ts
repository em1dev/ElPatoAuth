import { PasswordHasher } from '../../../encryption/hasher';
import { BadRequest, NotFoundError } from '../../../errors';
import { getApp } from '../../../repository/appRepository';
import { createCredentialUser, getUserByCredentials } from '../../../repository/userRepository';

export const createPasswordAuthenticatedUserHandler = async (email: string, password: string, appId: string) => {
  const app = getApp(appId);
  if (!app) throw new NotFoundError(`App with id ${appId} not found`);

  const hashedPassword = PasswordHasher.hashPassword(password);
  const exists = await getUserByCredentials(appId, email);
  if (exists) throw new BadRequest(`User with email ${email} already exists`);

  const id = await createCredentialUser(appId, email, hashedPassword);
  return id;
};