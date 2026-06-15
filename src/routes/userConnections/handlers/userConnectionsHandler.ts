import { googleApi } from '../../../api/googleApi';
import { TikTokApi } from '../../../api/tiktokApi';
import { TwitchApi } from '../../../api/twitchApi';
import { decrypt } from '../../../encryption';
import { HandlerApiResult } from '../../../HandlerApiResult';
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
  refreshToken: string,
  expiresInMs: number
}

export const userConnectionsHandler = async (appId: string, userId: number)
  : Promise<HandlerApiResult<ConnectionWithUserData[]>> => {

  const user = await getUser(userId, appId);
  if (!user)
    return HandlerApiResult.Error(404, `User ${userId} not found`);

  const data = await getUserConnections(user.id);

  const connectionsDecrypted = data.map(item => ({
    ...item,
    refresh_token: decrypt(item.refresh_token),
    token: decrypt(item.token)
  }));

  const connectionsWithUserData:Array<ConnectionWithUserData> = [];
  const now = Date.now();

  for (const connection of connectionsDecrypted) {
    let appService = await getAppService(appId, ExternalServiceType[connection.type]);
    if (!appService)
      return HandlerApiResult.Error(500, 'Service data missing');

    appService = {
      ...appService,
      clientId: decrypt(appService.clientId),
      clientSecret: decrypt(appService.clientSecret)
    };

    if (connection.type === ConnectionType.twitch) {
      const { success: user } = await TwitchApi.getUserInfo(connection.user_id, connection.token, appService.clientId);
      if (!user)
        return HandlerApiResult.Error(500, 'Unable to get user for connection details');
      // TODO - handle expired tokens here
      connectionsWithUserData.push({
        displayName: user.display_name,
        profileImageUrl: user.profile_image_url,
        refreshToken: connection.refresh_token,
        token: connection.token,
        type: connection.type,
        userId: connection.user_id,
        expiresInMs: connection.expires_at - now
      });
    }

    if (connection.type === ConnectionType.tiktok) {
      const userData = await TikTokApi.getUserInfo(connection.token);
      if (!userData.success)
        return HandlerApiResult.Error(500, 'Unable to get user for connection details');
      // TODO - handle expired tokens here
      connectionsWithUserData.push({
        displayName: userData.success.display_name,
        profileImageUrl: userData.success.avatar_url,
        refreshToken: connection.refresh_token,
        token: connection.token,
        type: connection.type,
        userId: connection.user_id,
        expiresInMs: connection.expires_at - now
      });
    }

    if (connection.type == ConnectionType.youtube) {
      const resp = await googleApi.getYoutubeChannel(connection.token, connection.user_id);

      if (resp.hasError) {
        switch (resp.error)
        {
        case 'NotFound':
          return HandlerApiResult.Error(500, 'No youtube channel found');
        case 'QuotaExceeded':
          return HandlerApiResult.Error(500, 'Youtube quota exceeded'); // should still return twitch credentials
        case 'BadRequest':
          return HandlerApiResult.Error(500, 'Youtube api error');
        }
      }

      const channel = resp.success;

      connectionsWithUserData.push({
        displayName: channel.snippet.title,
        profileImageUrl: channel.snippet.thumbnails.default.url,
        refreshToken: connection.refresh_token,
        token: connection.token,
        type: connection.type,
        userId: connection.user_id,
        expiresInMs: connection.expires_at - now
      });
    }
  }

  return HandlerApiResult.Success(200, connectionsWithUserData);
};
