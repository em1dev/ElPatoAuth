import { googleApi } from '../../../api/googleApi';
import { TikTokApi } from '../../../api/tiktokApi';
import { TwitchApi } from '../../../api/twitchApi';
import { decrypt, encrypt } from '../../../encryption';
import { HandlerApiResult } from '../../../HandlerApiResult';
import { logger } from '../../../logger';
import { ExternalServiceDto, getAppService } from '../../../repository/appRepository';
import { addUserConnection, getUserConnection } from '../../../repository/connectionRepository';
import { ConnectionType, ExternalServiceType } from '../../../repository/types';
import { getUser } from '../../../repository/userRepository';
import { TokenRefreshService } from '../../../tokenRefreshService';

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
): Promise<HandlerApiResult<null>> => {

  const user = await getUser(userId, appId);
  if (!user)
    return HandlerApiResult.Error(404, `User ${userId} could not be found`);

  const existingConnection = await getUserConnection(userId, connectionType);
  if (existingConnection)
    return HandlerApiResult.Error(409, `User ${userId} has an existing connection for ${connectionType}`);

  const service = await getAppServiceDecrypted(appId, connectionType);
  if (!service)
    return HandlerApiResult.Error(400, `Service ${connectionType} not supported`);

  const tokenResponse = await getTokenFromServiceHandler(code, service, redirectUrl);
  if (!tokenResponse)
    return HandlerApiResult.Error(500, 'Unable to get token');

  const encryptedToken = encrypt(tokenResponse.token);
  const encryptedRefreshToken = encrypt(tokenResponse.refreshToken);

  const expiresAt = TokenRefreshService.calculateExpiryDate(tokenResponse.expiresIn);

  await addUserConnection(userId, encryptedToken, encryptedRefreshToken, tokenResponse.userId, expiresAt, connectionType);

  return HandlerApiResult.Success(201, null);
};

const getTokenFromServiceHandler = async (code: string, service: ExternalServiceDto, redirectUrl: string):Promise<TokenResponse | undefined> => {
  switch (service.type){
  case ExternalServiceType.tiktok:
    return await getTikTokTokens(code, service, redirectUrl);
  case ExternalServiceType.twitch:
    return await getTwitchTokens(code, service, redirectUrl);
  case ExternalServiceType.youtube:
    return await getYoutubeTokens(code, service, redirectUrl);
  }
};

const getTikTokTokens = async (code: string, service: ExternalServiceDto, redirectUrl: string):Promise<TokenResponse | undefined> => {
  const resp = await TikTokApi.authenticateWithCode(code, service.clientId, service.clientSecret, redirectUrl);
  if (resp.error !== undefined) {
    logger.error(resp);
    return;
  }
  return {
    refreshToken: resp.success.refresh_token,
    token: resp.success.access_token,
    userId: resp.success.open_id,
    expiresIn: resp.success.expires_in
  };
};

const getTwitchTokens = async (code: string, service: ExternalServiceDto, redirectUrl: string):Promise<TokenResponse | undefined> => {
  const resp = await TwitchApi.authenticateCode(code, service.clientId, service.clientSecret, redirectUrl);
  if (resp.error) {
    logger.error(resp);
    return;
  }

  const verifyResp = await TwitchApi.verifyToken(resp.success.access_token);
  if (verifyResp.error){
    logger.error(verifyResp);
    return;
  }

  return {
    expiresIn: resp.success.expires_in,
    refreshToken: resp.success.refresh_token,
    token: resp.success.access_token,
    userId: verifyResp.success.user_id,
  };
};

const getYoutubeTokens = async (code: string, service: ExternalServiceDto, redirectUrl: string):Promise<TokenResponse | undefined> => {
  const tokens = await googleApi.authenticateCode(code, service.clientId, service.clientSecret, redirectUrl);
  if (!tokens) return;

  if (!tokens.refresh_token)
  {
    // api only return refresh token the first time we authenticate
    // to get another one we need to revoke connection and reconnect
    await googleApi.revokeToken(tokens.access_token);
    return;
  }

  const resp = await googleApi.getYoutubeChannel(tokens.access_token);
  if (resp.hasError) {
    switch (resp.error)
    {
    case 'NotFound':
      logger.info('Authenticated user does not have a youtube channel');
      break;
    case 'QuotaExceeded':
      logger.info('Youtube quota exceeded!');
      break;
    case 'BadRequest':
      logger.info('Youtube API error');
      break;
    }

    // revoke to avoid locking the connection on next connection
    // as refresh token can only be fetched once
    await googleApi.revokeToken(tokens.access_token);
    return;
  }

  return {
    expiresIn: tokens.expires_in,
    refreshToken: tokens.refresh_token,
    token: tokens.access_token,
    userId: resp.success.id,
  };
};
