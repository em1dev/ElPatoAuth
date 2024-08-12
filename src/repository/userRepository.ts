import { BadRequest } from '../errors';
import { db } from './db';
import { LoginProviderType, Tables } from './types';

const getUser = async (userId: number, appId: string) => {
    interface User {
      id: number,
      appId: number
    }

    const user = await db.get<{ 
      id: number,
      fkAppId: number
    }>(`
      SELECT *
      FROM ${Tables.user}
      WHERE id = $userId
      AND fk_app_id = $appId
    `, { $userId: userId, $appId: appId });

    if (!user) return;

    return {
      id: user.id,
      appId: user.fkAppId
    } satisfies User;
};

const getUserByProvider = async (appId: string, providerUserId: string, providerId: LoginProviderType) => {
  const data = await db.get<{
      userId: number,
      providerUserLogin: string,
      providerUserId: string
    }>(`
      SELECT
        ${Tables.user}.id AS userId,
        provider.user_id AS providerUserId,
        provider.user_login AS providerUserLogin
      FROM ${Tables.user}
      INNER JOIN ${Tables.loginProvider} as provider
        ON provider.fk_user_id = ${Tables.user}.id
      WHERE provider.user_id = $providerUserId
      AND provider.type = $providerId;
    `, { $providerUserId: providerUserId, $providerId: providerId});

  if (!data) return;

  return {
    app: appId,
    id: data.userId,
    provider: {
      type: providerId,
      userId: data.providerUserId,
      userLogin: data.providerUserLogin
    }
  };
};

const createCredentialUser = async (appId: string, email: string, passwordEncrypted: string) => {
  db.run('BEGIN TRANSACTION');
  try {
    const ctx = await db.run(`
        INSERT INTO ${Tables.passwordProvider} (email, password_encrypted)
        VALUES ($email, $passwordEncrypted);
      `, { $email: email, $passwordEncrypted: passwordEncrypted });

    const userCtx = await db.run(`
        INSERT INTO ${Tables.user} (fk_app_id, fk_password_provider_id)
        VALUES ($appId, $passwordId)
      `, { $appId: appId, $passwordId: ctx.lastID });

    db.run('COMMIT TRANSACTION');
    return userCtx.lastID;
  } catch(exception) {
    db.run('ROLLBACK TRANSACTION');
    throw exception;
  }
};

const getUserByCredentials = async (appId: string, email:string) => {
  const result = await db.get<{ id: number, encryptedPassword: string }>(`
    SELECT user.id as id, passwordProvider.password_encrypted as encryptedPassword 
    FROM ${Tables.passwordProvider} as passwordProvider
    INNER JOIN ${Tables.user} as user
      on user.fk_password_provider_id = passwordProvider.id
    WHERE passwordProvider.email = $email
    AND user.fk_app_id = $appId
  `, { $email: email, $appId: appId });

  console.log(result, appId, email);
  return result;
};

const createUser = async (
  appId: string,
  providers: Array<{
      userId: string,
      userLogin: string,
      type: LoginProviderType,
    }>
) => {
  // check that providers are different
  const uniqueProviders = new Set(providers.map(i => i.type));
  if (uniqueProviders.size !== providers.length){
    throw new BadRequest('providers are not unique');
  }

  try {
    db.run('BEGIN TRANSACTION');

    const ctx = await db.run(`
        INSERT INTO ${Tables.user} (fk_app_id)
        VALUES ($appId);
      `, { $appId: appId});

    const userId = ctx.lastID;

    for (const provider of providers) {
      await db.run(`
          INSERT INTO ${Tables.loginProvider} (user_id, user_login, type, fk_user_id)
          VALUES ($providerUserId, $providerUserLogin, $providerType, $userId)
        `, { $providerUserId: provider.userId, $providerUserLogin: provider.userLogin, $providerType: provider.type, $userId: userId});
    }

    db.run('COMMIT TRANSACTION');
    return userId;
  } catch(exception) {
    db.run('ROLLBACK TRANSACTION');
    throw exception;
  }
};

export {
  getUser,
  getUserByProvider,
  createUser,
  createCredentialUser,
  getUserByCredentials
};