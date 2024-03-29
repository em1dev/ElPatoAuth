import { ExternalServiceType, LoginProviderType } from '../../../repository/types';
import { TwitchApi } from '../../../api/twitchApi';
import { BadRequest, InternalError, UnauthorizedError } from '../../../errors';
import { createUser, getUserByProvider } from '../../../repository/userRepository';
import { ExternalServiceDto, getAppService } from '../../../repository/appRepository';
import { decrypt } from '../../../encryption';
import { TikTokApi } from '../../../api/tiktokApi';
import { TokenUser } from '../../../types';
import { createToken } from '../../../jwtService';

type ProviderAuthResult = {
  refreshToken: string,
  accessToken: string,
  login: string,
  userId: string,
  displayName: string,
  profileImageUrl: string
}

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
  redirectUrl: string
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

  const { access_token, refresh_token } = authenticationResult.success;
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

  const { access_token, refresh_token, open_id } = authenticationResult.success;

  const userInfoResp = await TikTokApi.getUserInfo(access_token);
  if (userInfoResp.error !== undefined) {
    console.error('unable to get user information after authentication', userInfoResp);
    throw new UnauthorizedError('Tiktok token verification failed');
  }

  const { username, display_name, avatar_url } = userInfoResp.success;

  return {
    refreshToken: refresh_token,
    accessToken: access_token,
    login: username,
    userId: open_id,
    displayName: display_name,
    profileImageUrl: avatar_url
  };
};