import { TikTokApi } from '../../../api/tiktokApi';
import { TwitchApi } from '../../../api/twitchApi';
import { decrypt, encrypt } from '../../../encryption';
import { BadRequest, HttpErrorBase, NotFoundError, UnauthorizedError } from '../../../errors';
import { ExternalServiceDto, getAppService } from '../../../repository/appRepository';
import { addUserConnection, getUserConnection } from '../../../repository/connectionRepository';
import { ConnectionType, ExternalServiceType } from '../../../repository/types';
import { getUser } from '../../../repository/userRepository';

interface TokenResponse {
  token: string,
  refreshToken: string,
  userId: string,
  expiresIn: number
}

const getAppServiceDecrypted = async (appId: string, connectionType: ConnectionType) => {
  const service = await getAppService(appId, ExternalServiceType[connectionType]);
  if (!service) return;
  return {
    ...service,
    clientId: decrypt(service.clientId),
    clientSecret: decrypt(service.clientSecret)
  } satisfies ExternalServiceDto;
};

export const connectAccountHandler = async (
  code: string,
  appId: string,
  userId: number,
  connectionType: ConnectionType,
  redirectUrl: string
) => {

  const user = await getUser(userId, appId);
  if (!user) throw new NotFoundError(`user ${userId} could not found`);

  const existingConnection = await getUserConnection(userId, connectionType);
  if (existingConnection) throw new HttpErrorBase(409, `user ${userId} has an existing connection for ${connectionType}`);

  const service = await getAppServiceDecrypted(appId, connectionType);
  if (!service) throw new BadRequest(`Service ${connectionType} not supported`);

  let tokenResponse: TokenResponse | null = null;
  switch (connectionType){
  case 'tiktok':
    tokenResponse = await getTikTokTokens(code, service, redirectUrl);
    break;
  case 'twitch':
    tokenResponse = await getTwitchTokens(code, service, redirectUrl);
    break;
  default:
    throw new BadRequest(`invalid connection type ${connectionType}`);
  }

  const encryptedToken = encrypt(tokenResponse.token);
  const encryptedRefreshToken = encrypt(tokenResponse.refreshToken);

  const expiresInMs = tokenResponse.expiresIn * 1000;
  const expiresAt = Date.now() + expiresInMs;

  await addUserConnection(userId, encryptedToken, encryptedRefreshToken, tokenResponse.userId, expiresAt, connectionType);
};

const getTikTokTokens = async (code: string, service: ExternalServiceDto, redirectUrl: string):Promise<TokenResponse> => {
  const resp = await TikTokApi.authenticateWithCode(code, service.clientId, service.clientSecret, redirectUrl);
  if (resp.error !== undefined) {
    console.error(resp);
    throw new UnauthorizedError('Unable to connect with tiktok api');
  }
  return {
    refreshToken: resp.success.refresh_token,
    token: resp.success.access_token,
    userId: resp.success.open_id,
    expiresIn: resp.success.expires_in
  };
};

const getTwitchTokens = async (code: string, service: ExternalServiceDto, redirectUrl: string):Promise<TokenResponse> => {
  const resp = await TwitchApi.authenticateCode(code, service.clientId, service.clientSecret, redirectUrl);
  if (resp.error) {
    console.error(resp);
    throw new UnauthorizedError('Unable to connect with Twitch api');
  }

  const verifyResp = await TwitchApi.verifyToken(resp.success.access_token);
  if (verifyResp.error){
    console.error(verifyResp);
    throw new UnauthorizedError('Unable to connect with Twitch api');
  }

  return {
    expiresIn: resp.success.expires_in,
    refreshToken: resp.success.refresh_token,
    token: resp.success.access_token,
    userId: verifyResp.success.user_id,
  };
};