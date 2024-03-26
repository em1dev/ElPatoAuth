import { db } from './db';
import { ConnectionType, Tables } from './types';

const getUserConnections = async (userId: number) => {
    interface ConnectionData {
      token: string,
      refresh_token: string,
      user_id: string,
      type: string
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
      token: string,
      refresh_token: string,
      user_id: string,
      type: string
    }

    const connection = await db.get<ConnectionData>(`
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
    };
};

const addUserConnection = async (
  userId: number,
  token: string,
  refreshToken: string,
  connectionUserId: string,
  type: ConnectionType
) => {
  await db.run(`
      INSERT INTO ${Tables.connection} (token, refresh_token, user_id, type, fk_user_id)
      VALUES ($token, $refreshToken, $connectionUserId, $type, $userId);
    `, { $token: token, $refreshToken: refreshToken, $connectionUserId: connectionUserId, $type: type, $userId: userId });
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
  getUserConnections
};