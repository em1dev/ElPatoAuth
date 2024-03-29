import { TikTokApi } from '../../../api/tiktokApi';
import { TwitchApi } from '../../../api/twitchApi';
import { decrypt } from '../../../encryption';
import { InternalError, NotFoundError } from '../../../errors';
import { getAppService } from '../../../repository/appRepository';
import { getUserConnections } from '../../../repository/connectionRepository';
import { ConnectionType, ExternalServiceType } from '../../../repository/types';
import { getUser } from '../../../repository/userRepository';

interface ConnectionWithUserData {
  profileImageUrl: string
  displayName: string,
  userId: string,
  type: string,
  token: string,
  refreshToken: string
}

export const userConnectionsHandler = async (appId: string, userId: number) => {
  const user = await getUser(userId, appId);
  if (!user) throw new NotFoundError(`user ${userId} not found`);
  const data = await getUserConnections(user.id);

  const connectionsDecrypted = data.map(item => ({
    ...item,
    refresh_token: decrypt(item.refresh_token),
    token: decrypt(item.token)
  }));

  const connectionsWithUserData:Array<ConnectionWithUserData> = [];

  for (const connection of connectionsDecrypted) {
    let appService = await getAppService(appId, ExternalServiceType[connection.type]);
    if (!appService) throw new InternalError('Service data missing');

    appService = { 
      ...appService,
      clientId: decrypt(appService.clientId),
      clientSecret: decrypt(appService.clientSecret)
    };

    if (connection.type === ConnectionType.twitch) {
      const { success: user } = await TwitchApi.getUserInfo(connection.user_id, connection.token, appService.clientId);
      if (!user) throw new InternalError('Unable to get user for connection details');
      // TODO - handle expired tokens here
      connectionsWithUserData.push({
        displayName: user.display_name,
        profileImageUrl: user.profile_image_url,
        refreshToken: connection.refresh_token,
        token: connection.token,
        type: connection.type,
        userId: connection.user_id
      });
    }

    if (connection.type === ConnectionType.tiktok) {
      const userData = await TikTokApi.getUserInfo(connection.token);
      if (!userData.success) throw new InternalError('Unable to get user for connection details');
      // TODO - handle expired tokens here
      connectionsWithUserData.push({
        displayName: userData.success.display_name,
        profileImageUrl: userData.success.avatar_url,
        refreshToken: connection.refresh_token,
        token: connection.token,
        type: connection.type,
        userId: connection.user_id
      });
    }
  }

  return connectionsWithUserData;
};