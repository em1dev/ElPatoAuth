import { db } from './db';
import { ConnectionType, Tables } from './types';

const getAllConnectionsAboutToExpire = async (timeUntilExpiresInMs: number) => {
  const now = Date.now();
  const threshold = now + timeUntilExpiresInMs;

  interface ConnectionData {
    id: number,
    token: string,
    refreshToken: string,
    expiresAt: number,
    userId: string,
    type: ConnectionType,
    fkUserId: number,
    appId: string
  }

  const connections = await db.all<ConnectionData>(`
    SELECT
      connection.id AS id,
      connection.token,
      connection.refresh_token as refreshToken,
      connection.user_id as userId,
      connection.type,
      connection.fk_user_id as fkUserId,
      connection.expires_at as expiresAt,
      user.fk_app_id as appId
    FROM ${Tables.connection} AS connection
    INNER JOIN ${Tables.user} AS user ON connection.fk_user_id = user.id
    WHERE connection.expires_at < $threshold
  `, { $threshold: threshold });

  return connections;
};

const getUserConnections = async (userId: number) => {
    interface ConnectionData {
      token: string,
      refresh_token: string,
      user_id: string,
      type: ConnectionType
    }

    const connections = await db.all<ConnectionData>(`
      SELECT token, refresh_token, user_id, type
      FROM ${Tables.connection}
      WHERE fk_user_id = $userId
    `, { $userId: userId });

    return connections;
};

const getUserConnection = async (userId: number, connectionType: ConnectionType) => {
    interface ConnectionData {
      id: number,
      token: string,
      refresh_token: string,
      user_id: string,
      type: string
    }

    const connection = await db.get<ConnectionData>(`
      SELECT id, token, refresh_token, user_id, type
      FROM ${Tables.connection}
      WHERE fk_user_id = $userId
      AND type = $connectionType;
    `, { $userId: userId, $connectionType: connectionType });

    if (!connection) return;

    return {
      id: connection.id,
      refreshToken: connection.refresh_token,
      token: connection.token,
      type: connection.type,
      userId: connection.user_id
    };
};

const addUserConnection = async (
  userId: number,
  token: string,
  refreshToken: string,
  connectionUserId: string,
  expiresAt: number,
  type: ConnectionType
) => {
  await db.run(`
      INSERT INTO ${Tables.connection} (token, refresh_token, user_id, type, fk_user_id, expires_at)
      VALUES ($token, $refreshToken, $connectionUserId, $type, $userId, $expiresAt);
    `, { $token: token, $refreshToken: refreshToken, $connectionUserId: connectionUserId, $type: type, $userId: userId, $expiresAt: expiresAt });
};

const updateUserConnection = async (
  id: number,
  token: string,
  refreshToken: string,
  expiresAt: number
) => {
  await db.run(`
    UPDATE ${Tables.connection}
    SET 
      token = $token,
      refresh_token = $refreshToken,
      expires_at = $expiresAt
    WHERE id = $id
  `, { $token: token, $refreshToken: refreshToken, $expiresAt: expiresAt, $id: id });
};

const deleteUserConnection = async (
  userId: number,
  type: ConnectionType
) => {
  await db.run(`
      DELETE FROM ${Tables.connection}
      WHERE ${Tables.connection}.type = $type
        AND ${Tables.connection}.fk_user_id = $userId
    `, { $userId: userId, $type: type });
};

export {
  deleteUserConnection,
  addUserConnection,
  getUserConnection,
  getUserConnections,
  getAllConnectionsAboutToExpire,
  updateUserConnection
};