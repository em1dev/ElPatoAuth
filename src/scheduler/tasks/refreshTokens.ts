import { TikTokApi } from '../../api/tiktokApi';
import { TOKEN_REFRESH_SETTINGS } from '../../config';
import { decrypt, encrypt } from '../../encryption';
import { ExternalServiceDto, getAppServices } from '../../repository/appRepository';
import { deleteUserConnection, getAllConnectionsAboutToExpire, updateUserConnection } from '../../repository/connectionRepository';
import { ConnectionType } from '../../repository/types';

export const refreshTokens = async () => {
  try {
    const connections = await getAllConnectionsAboutToExpire(TOKEN_REFRESH_SETTINGS.updateThreshold);
    if (connections.length === 0) return;
    console.log(`Refreshing ${connections.length} connections`);
    // app services will be cached as we iterate,
    //  this means that if the data changes as we are refreshing we might find stale data
    //  connections should be deleted if we change the client ids and secrets so this should never be an issue
    const appServicesCache: Record<string, Array<ExternalServiceDto>> = {};

    for (let connection of connections) {
      connection = {
        ...connection,
        refreshToken: decrypt(connection.refreshToken),
        token: decrypt(connection.token)
      };
      let services = appServicesCache[connection.appId];

      if (!services) {
        services = await getAppServices(connection.appId);
        if (!services) {
          console.error(`Services for ${connection.appId} not found when refreshing tokens`);
          await deleteUserConnection(connection.fkUserId, connection.type);
          continue;
        }

        services = services.map(s => ({
          ...s,
          clientId: decrypt(s.clientId),
          clientSecret: decrypt(s.clientSecret)
        }));

        appServicesCache[connection.appId] = services;
      }

      const service = services.find(item => item.type.toString() === connection.type.toString());
      if (!service){
        console.error(`Could not find service ${connection.type} for app ${connection.appId} when refreshing tokens`);
        await deleteUserConnection(connection.fkUserId, connection.type);
        continue;
      }

      const refreshResult = await getRefreshToken(service, connection.type, connection.refreshToken);
      if (!refreshResult) {
        console.error(`Failed refreshing token for user ${connection.fkUserId} with connection ${connection.type} for app ${connection.appId}`);
        await deleteUserConnection(connection.fkUserId, connection.type);
        continue;
      }

      const expiresInMs = refreshResult.expiresIn * 1000;
      const expiresAt = Date.now() + expiresInMs;

      await updateUserConnection(
        connection.id,
        encrypt(refreshResult.token),
        encrypt(refreshResult.refreshToken),
        expiresAt
      );
    }
  } catch (e) {
    console.error(e);
  }
};

interface RefreshTokenResult {
  token: string,
  refreshToken: string,
  expiresIn: number,
}

const getRefreshToken = async (service: ExternalServiceDto, type: ConnectionType, refreshToken: string): Promise<RefreshTokenResult | null> => {
  if (type === ConnectionType.tiktok) {
    const data = await TikTokApi.refreshToken(refreshToken, service.clientId, service.clientSecret);
    if (data.error) {
      console.error(data);
      console.error(`Error refreshing token for service ${type}`);
      return null;
    }
    return {
      expiresIn: data.success.expires_in,
      refreshToken: data.success.refresh_token,
      token: data.success.access_token
    };
  }


  throw new Error('not implemented');
};