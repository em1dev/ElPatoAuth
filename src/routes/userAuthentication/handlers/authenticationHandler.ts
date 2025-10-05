import { ConnectionType, ExternalServiceType, LoginProviderType } from '../../../repository/types';
import { TwitchApi } from '../../../api/twitchApi';
import { BadRequest, InternalError, UnauthorizedError } from '../../../errors';
import { createUser, getUserByProvider } from '../../../repository/userRepository';
import { ExternalServiceDto, getAppService } from '../../../repository/appRepository';
import { decrypt, encrypt } from '../../../encryption';
import { TikTokApi } from '../../../api/tiktokApi';
import { TokenUser } from '../../../types';
import { createToken } from '../../../jwtService';
import { addUserConnection, getUserConnection, updateUserConnection } from '../../../repository/connectionRepository';
import { TokenRefreshService } from '../../../tokenRefreshService';

type ProviderAuthResult = {
  refreshToken: string,
  accessToken: string,
  expiresIn: number,
  login: string,
  userId: string,
  displayName: string,
  profileImageUrl: string
}

const getConnectionProviderFromLoginProvier = (login: LoginProviderType) => {
  switch (login)
  {
  case LoginProviderType.tiktok:
    return ConnectionType.tiktok;
  case LoginProviderType.twitch:
    return ConnectionType.twitch;
  default:
    return null;
  }
};

const getAppServiceDecrypted = async (appId: string, providerId: LoginProviderType) => {
  const service = await getAppService(appId, ExternalServiceType[providerId]);
  if (!service) return;
  return {
    ...service,
    clientId: decrypt(service.clientId),
    clientSecret: decrypt(service.clientSecret)
  } satisfies ExternalServiceDto;
};

export const authenticationHandler = async (
  code: string,
  appId: string,
  providerId: LoginProviderType,
  redirectUrl: string,
  shouldUpsertConnection: boolean = false
) => {
  let result: ProviderAuthResult | null = null;

  const service = await getAppServiceDecrypted(appId, providerId);
  if (!service) throw new BadRequest(`Login provider ${providerId} not supported on this app`);

  switch(providerId) {
  case LoginProviderType.twitch:
    result = await handleTwitchAuth(code, service, redirectUrl);
    break;
  case LoginProviderType.tiktok:
    result = await handleTikTokAuth(code, service, redirectUrl);
    break;
  }

  // if it does not exist create it
  let userFromDb = await getUserByProvider(appId, result.userId, providerId);

  if (!userFromDb) {
    console.log('new user authenticated. creating user');
    await createUser(appId, [{
      type: providerId,
      userId: result.userId,
      userLogin: result.login
    }]);

    const insertedUserInDb = await getUserByProvider(appId, result.userId, providerId);
    if (!insertedUserInDb) throw new InternalError('created entity not found. something went seriously wrong D:');
    userFromDb = insertedUserInDb;
  }

  const connectionType = getConnectionProviderFromLoginProvier(providerId);
  if (shouldUpsertConnection && connectionType != null)
  {
    const encryptedToken = encrypt(result.accessToken);
    const encryptedRefreshToken = encrypt(result.refreshToken);

    const expiresAt = TokenRefreshService.calculateExpiryDate(result.expiresIn);

    const existingConnection = await getUserConnection(userFromDb.id, connectionType);
    if (existingConnection)
    {
      await updateUserConnection(userFromDb.id, encryptedToken, encryptedRefreshToken, expiresAt);
    } else {
      await addUserConnection(userFromDb.id, encryptedToken, encryptedRefreshToken, result.userId, expiresAt, connectionType);
    }
  }

  const userResult: TokenUser = {
    app: userFromDb.app,
    id: userFromDb.id,
    provider: {
      userId: userFromDb.provider.userId,
      displayName: result.displayName,
      profileImageUrl: result.profileImageUrl,
      type: userFromDb.provider.type,
      userLogin: userFromDb.provider.userLogin
    }
  };

  return await createToken(userResult, service.type);
};

const handleTwitchAuth = async (code: string, service: ExternalServiceDto, redirectUrl: string): Promise<ProviderAuthResult> => {
  const authenticationResult = await TwitchApi.authenticateCode(code, service.clientId, service.clientSecret, redirectUrl);
  if (authenticationResult.error) {
    console.error(authenticationResult.error);
    throw new UnauthorizedError('Invalid twitch authentication');
  }

  const { access_token, refresh_token, expires_in } = authenticationResult.success;
  const tokenVerifyResponse = await TwitchApi.verifyToken(access_token);
  if (tokenVerifyResponse.error) {
    console.error(tokenVerifyResponse.error);
    throw new UnauthorizedError('Twitch token verification failed');
  }
  const { login, user_id } = tokenVerifyResponse.success;

  const { success: user } = await TwitchApi.getUserInfo(user_id, access_token, service.clientId);
  if (!user) {
    console.error('Unable to find user');
    throw new InternalError('Unable to fetch user');
  }

  return {
    refreshToken: refresh_token,
    accessToken: access_token,
    expiresIn: expires_in,
    login,
    userId: user_id,
    displayName: user.display_name,
    profileImageUrl: user.profile_image_url
  };
};

const handleTikTokAuth = async (code: string, service: ExternalServiceDto, redirectUrl: string): Promise<ProviderAuthResult> => {
  const authenticationResult = await TikTokApi.authenticateWithCode(code, service.clientId, service.clientSecret, redirectUrl);
  if (authenticationResult.error !== undefined) {
    console.error('error authenticating with tiktok', authenticationResult);
    throw new UnauthorizedError('Tiktok token verification failed');
  }

  const { access_token, refresh_token, open_id, expires_in } = authenticationResult.success;

  const userInfoResp = await TikTokApi.getUserInfo(access_token);
  if (userInfoResp.error !== undefined) {
    console.error('unable to get user information after authentication', userInfoResp);
    throw new UnauthorizedError('Tiktok token verification failed');
  }

  const { username, display_name, avatar_url } = userInfoResp.success;

  return {
    refreshToken: refresh_token,
    accessToken: access_token,
    expiresIn: expires_in,
    login: username,
    userId: open_id,
    displayName: display_name,
    profileImageUrl: avatar_url
  };
};