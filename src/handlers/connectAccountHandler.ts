import { TikTokApi } from "../api/tiktokApi";
import { encrypt } from "../encryption";
import { BadRequest, HttpErrorBase, InternalError, NotFoundError } from "../errors";
import { Repository } from "../repository";
import { ConnectionType } from "../repository/entityTypes";

interface TokenResponse {
  token: string,
  refreshToken: string,
  userId: string
}

export const connectAccountHandler = async (
  code: string,
  appId: string,
  userId: number,
  connectionType: ConnectionType | string,
  repository: Repository
) => {

  const user = await repository.getUser(userId, appId);
  if (!user) throw new NotFoundError(`user ${userId} could not found`);

  const existingConnection = await repository.getUserConnection(userId, connectionType);
  if (existingConnection) throw new HttpErrorBase(409, `user ${userId} has an existing connection for ${connectionType}`);

  // todo - verify code and get tokens
  let tokenResponse: TokenResponse | null = null;
  switch (connectionType){
    case 'tiktok':
      tokenResponse = await getTikTokTokens(code);
      break;
    case 'youtube':
      tokenResponse = await getYoutubeTokens(code);
      break;
    case 'twitch':
      tokenResponse = await getTwitchTokens(code);
      break;
    default:
      throw new BadRequest(`invalid connection type ${connectionType}`);
  }
  if (!tokenResponse) throw new InternalError('unable to fetch token');

  const encryptedToken = encrypt(tokenResponse.token);
  const encryptedRefreshToken = encrypt(tokenResponse.refreshToken);

  await repository.addUserConnection(userId, encryptedToken, encryptedRefreshToken, tokenResponse.userId, connectionType)
}

const getTikTokTokens = async (code: string):Promise<TokenResponse> => {
  const resp = await TikTokApi.authenticateWithCode(code);

  return {
    token: resp.access_token,
    refreshToken: resp.refresh_token,
    userId: resp.open_id,
  };
}

const getYoutubeTokens = async (code: string) => {
  return {
    token: 'test-youtube-token',
    refreshToken: 'test-refresh-token',
    userId: 'youtube-user-id',
  };
}

const getTwitchTokens = async (code: string) => {
  return {
    token: 'test-youtube-token',
    refreshToken: 'test-refresh-token',
    userId: 'youtube-user-id',
  };
}