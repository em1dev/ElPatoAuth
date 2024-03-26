import { TikTokApi } from '../../../api/tiktokApi';
import { decrypt, encrypt } from '../../../encryption';
import { BadRequest, HttpErrorBase, NotFoundError, UnauthorizedError } from '../../../errors';
import { ExternalServiceDto, getAppService } from '../../../repository/appRepository';
import { addUserConnection, getUserConnection } from '../../../repository/connectionRepository';
import { ConnectionType, ExternalServiceType } from '../../../repository/types';
import { getUser } from '../../../repository/userRepository';

interface TokenResponse {
  token: string,
  refreshToken: string,
  userId: string
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
  case 'youtube':
    tokenResponse = await getYoutubeTokens(code);
    break;
  case 'twitch':
    tokenResponse = await getTwitchTokens(code);
    break;
  default:
    throw new BadRequest(`invalid connection type ${connectionType}`);
  }

  const encryptedToken = encrypt(tokenResponse.token);
  const encryptedRefreshToken = encrypt(tokenResponse.refreshToken);

  await addUserConnection(userId, encryptedToken, encryptedRefreshToken, tokenResponse.userId, connectionType);
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
    userId: resp.success.open_id
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getYoutubeTokens = async (code: string):Promise<TokenResponse> => {
  throw new Error('Youtube connection not implemented');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getTwitchTokens = async (code: string):Promise<TokenResponse> => {
  throw new Error('Twitch connection not implemented');
};