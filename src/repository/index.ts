import { BadRequest } from "../errors";
import { Database } from "./Database";
import { MigrationRunner } from "./Database/migrations";
import { Connection, ConnectionType, LoggedInUser, LoginProvider, Tables } from "./entityTypes";
import crypto from 'node:crypto';

export class Repository {
  private _db: Database;

  constructor(){
    this._db = new Database('./db.db');
    const migrationRunner = new MigrationRunner(this._db);
    migrationRunner.run();
  }

  public getUser = async (userId: number, appId: string) => {
    const user = await this._db.get<{ 
      id: number,
      app: string
    }>(`
      SELECT *
      FROM ${Tables.user}
      WHERE id = $userId
      AND app = $appId
    `, { $userId: userId, $appId: appId });
    return user;
  }

  public getUserConnections = async (userId: number) => {
    interface ConnectionData {
      token: string,
      refresh_token: string,
      user_id: string,
      type: string
    }

    const connections = await this._db.all<ConnectionData>(`
      SELECT token, refresh_token, user_id, type
      FROM ${Tables.connection}
      WHERE fk_user_id = $userId
    `, { $userId: userId });

    return connections;
  }

  public getUserConnection = async (userId: number, connectionType: string) => {
    interface ConnectionData {
      token: string,
      refresh_token: string,
      user_id: string,
      type: string
    }

    const connection = await this._db.get<ConnectionData>(`
      SELECT token, refresh_token, user_id, type
      FROM ${Tables.connection}
      WHERE fk_user_id = $userId
      AND type = $connectionType;
    `, { $userId: userId, $connectionType: connectionType });

    if (!connection) return;

    return {
      refreshToken: connection.refresh_token,
      token: connection.token,
      type: connection.type,
      userId: connection.user_id
    } as Connection
  };

  public addUserConnection = async (
    userId: number,
    token: string,
    refreshToken: string,
    connectionUserId: string,
    type: ConnectionType
  ) => {
    // todo - encrypt user tokens
    await this._db.run(`
      INSERT INTO ${Tables.connection} (token, refresh_token, user_id, type, fk_user_id)
      VALUES ($token, $refreshToken, $connectionUserId, $type, $userId);
    `, { $token: token, $refreshToken: refreshToken, $connectionUserId: connectionUserId, $type: type, $userId: userId });
  }

  public deleteUserConnection = async (
    userId: number,
    type: ConnectionType | string
  ) => {
    // todo - encrypt user tokens
    await this._db.run(`
      DELETE FROM ${Tables.connection}
      WHERE ${Tables.connection}.type = $type
        AND ${Tables.connection}.fk_user_id = $userId
    `, { $userId: userId, $type: type });
  }

  public getUserByProvider = async (appId: string, providerUserId: string, providerId: LoginProvider) => {
    const data = await this._db.get<{
      userId: number,
      providerUserLogin: string,
      providerUserId: string
    }>(`
      SELECT
        ${Tables.user}.id AS userId,
        provider.user_id AS providerUserId,
        provider.user_login AS providerUserLogin
      FROM ${Tables.user}
      INNER JOIN ${Tables.provider} as provider
        ON ${Tables.provider}.fk_user_id = ${Tables.user}.id
      WHERE ${Tables.provider}.user_id = $providerUserId
      AND ${Tables.provider}.type = $providerId;
    `, { $providerUserId: providerUserId, $providerId: providerId});

    if (!data) return;

    return {
      app: appId,
      id: data.userId,
      provider: {
        type: 'twitch',
        userId: data.providerUserId,
        userLogin: data.providerUserLogin
      }
    } satisfies LoggedInUser;
  }

  public createUser = async (
    appId: string,
    providers: Array<{
      userId: string,
      userLogin: string,
      type: LoginProvider,
    }>
  ) => {
    // check that providers are different
    const uniqueProviders = new Set(providers.map(i => i.type));
    if (uniqueProviders.size !== providers.length){
      throw new BadRequest('providers are not unique');
    }

    try {
      this._db.run(`BEGIN TRANSACTION`);

      const ctx = await this._db.run(`
        INSERT INTO ${Tables.user} (app)
        VALUES ($appId);
      `, { $appId: appId});

      const userId = ctx.lastID;

      for (const provider of providers) {
        await this._db.run(`
          INSERT INTO ${Tables.provider} (user_id, user_login, type, fk_user_id)
          VALUES ($providerUserId, $providerUserLogin, $providerType, $userId)
        `, { $providerUserId: provider.userId, $providerUserLogin: provider.userLogin, $providerType: provider.type, $userId: userId});
      }

      this._db.run(`COMMIT TRANSACTION`);
      return userId;
    } catch(exception) {
      this._db.run(`ROLLBACK TRANSACTION`);
      throw exception;
    }
  }
}