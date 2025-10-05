import { TOKEN_REFRESH_SETTINGS } from '../../config';
import { decrypt, encrypt } from '../../encryption';
import { ExternalServiceDto, getAppServices } from '../../repository/appRepository';
import { deleteUserConnection, getAllConnectionsAboutToExpire, updateUserConnection } from '../../repository/connectionRepository';
import { TokenRefreshService } from '../../tokenRefreshService';

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

      const refreshResult = await TokenRefreshService.getRefreshToken(service, connection.type, connection.refreshToken);
      if (!refreshResult) {
        console.error(`Failed refreshing token for user ${connection.fkUserId} with connection ${connection.type} for app ${connection.appId}`);
        await deleteUserConnection(connection.fkUserId, connection.type);
        continue;
      }

      await updateUserConnection(
        connection.id,
        encrypt(refreshResult.token),
        encrypt(refreshResult.refreshToken),
        refreshResult.expiresAt
      );
    }
  } catch (e) {
    console.error(e);
  }
};
