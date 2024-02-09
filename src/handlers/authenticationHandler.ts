import { Repository } from "../repository";
import { LoginProvider } from "../repository/entityTypes";
import { TwitchApi } from "../api/twitchApi";
import { BadRequest, InternalError } from "../errors";

type ProviderAuthResult = {
  refreshToken: string,
  accessToken: string,
  login: string,
  userId: string
}

export const authenticationHandler = async (
  code: string,
  appId: string,
  providerId: string | LoginProvider,
  repository: Repository
) => {
  let result: ProviderAuthResult | null = null;

  switch(providerId) {
    case 'twitch':
      result = await authTwitch(code);
      break;
    default:
  }

  if (!result) throw new BadRequest(`Provider ${providerId} not supported`);

  // if it does not exist create it
  const userFromDb = await repository.getUserByProvider(appId, result.userId, 'twitch');
  if (userFromDb) {
    // TODO - map to actual user
    return userFromDb;
  }

  console.log('new user authenticated. creating user');
  await repository.createUser(appId, [{
    type: 'twitch',
    userId: result.userId,
    userLogin: result.login
  }]);

  const insertedUserInDb = await repository.getUserByProvider(appId, result.userId, 'twitch');
  if (!insertedUserInDb) throw new InternalError('created entity not found. something went seriously wrong D:');
  return insertedUserInDb;
};

const authTwitch = async (code: string): Promise<ProviderAuthResult> => {
  return {
    refreshToken: 'data_refresh_token',
    accessToken: 'data_access_token',
    login: 'data_login',
    userId: 'data_user_id'
  };

  const { refresh_token, access_token, expires_in, scope } = await TwitchApi.authenticateCode(code);
  const { login, user_id } = await TwitchApi.verifyToken(access_token);

  return {
    refreshToken: refresh_token,
    accessToken: access_token,
    login,
    userId: user_id
  }
}