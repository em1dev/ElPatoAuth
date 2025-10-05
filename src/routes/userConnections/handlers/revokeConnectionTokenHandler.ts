import { TwitchApi } from '../../../api/twitchApi';
import { decrypt, encrypt } from '../../../encryption';
import { NotFoundError } from '../../../errors';
import { getAppService } from '../../../repository/appRepository';
import { deleteUserConnection, getUserConnection, updateUserConnection } from '../../../repository/connectionRepository';
import { ConnectionType, ExternalServiceType } from '../../../repository/types';
import { getUser } from '../../../repository/userRepository';
import { TokenRefreshService } from '../../../tokenRefreshService';

export const revokeConnectionTokenHandler = async (userId: number, appId: string, connectionTypeId: ConnectionType) => {
  const user = await getUser(userId, appId);
  if (!user) throw new NotFoundError(`user ${userId} not found`);

  const connection = await getUserConnection(userId, connectionTypeId);
  if (!connection) throw new NotFoundError(`connection ${connectionTypeId} for user ${userId} not found`);

  if (connectionTypeId != ConnectionType.twitch) throw new Error('Not implemented');

  const service = await getAppService(appId, ExternalServiceType.twitch);
  if (!service) throw new Error('Service not found while revoking');

  service.clientId = decrypt(service.clientId);
  service.clientSecret = decrypt(service.clientSecret);

  const resp = await TwitchApi.revokeToken(connection.token, service.clientId);
  if (resp.error)
  {
    console.log('error revoking token', resp.error);
  }

  const refreshToken = decrypt(connection.refreshToken);
  const refreshResult = await TokenRefreshService.getRefreshToken(service, connectionTypeId, refreshToken);

  if (!refreshResult) {
    console.error(`Failed refreshing token for user ${userId} with connection ${connection.type} for app ${appId}`);
    await deleteUserConnection(userId, connectionTypeId);
    return;
  }

  await updateUserConnection(
    connection.id,
    encrypt(refreshResult.token),
    encrypt(refreshResult.refreshToken),
    refreshResult.expiresAt
  );
};