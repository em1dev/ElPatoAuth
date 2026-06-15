import { daysInSeconds, RedisCache } from '../../cache';
import { logger } from '../../logger';
import { apiClient } from '../apiClient';
import { TokenCodeResponse, TokenRefreshResponse, TokenVerifyResponse, UserDetails } from './types';

interface TwitchError {
  status: number,
  message: string
}

export type TwitchResult<T> = { success: T, error?: undefined } | { error: TwitchError, success?: undefined };

const getUserInfo = async (id: string, token: string, clientId: string): Promise<TwitchResult<UserDetails | undefined>> => {
  const cache = RedisCache.getInstance();
  const cacheKey = `twitch-user-id-${id}`;
  const cachedUser = await cache.getItem<UserDetails>(cacheKey);
  if (cachedUser) return { success: cachedUser };

  const resp = await apiClient({
    url: `https://api.twitch.tv/helix/users?id=${id}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId
    }
  });

  if (!resp.ok) {
    const error = await resp.json() as TwitchError;
    logger.error(error, `Api error ${resp.status}`);
    return { error };
  }

  const data = await resp.json() as { data: Array<UserDetails> };
  const user = data.data.find(user => user.id === id);

  if (user) {
    await cache.setItem<UserDetails>(cacheKey, user, daysInSeconds(1));
  }

  return { success: user };
};

const authenticateCode = async (
  code: string, clientId: string, clientSecret: string, redirectUrl: string
): Promise<TwitchResult<TokenCodeResponse>> => {

  const resp = await apiClient({
    url: 'https://id.twitch.tv/oauth2/token',
    method: 'POST',
    body: {
      'client_id': clientId,
      'grant_type': 'authorization_code',
      'redirect_uri': redirectUrl,
      'client_secret': clientSecret,
      code
    }
  });

  if (!resp.ok) {
    const twitchError = await resp.json() as TwitchError;
    return { error: twitchError };
  }

  const data = await resp.json() as TokenCodeResponse;
  return { success: data };
};

const verifyToken = async (token: string): Promise<TwitchResult<TokenVerifyResponse>> => {
  const resp = await apiClient({
    url: 'https://id.twitch.tv/oauth2/validate',
    headers: {
      'Authorization': `OAuth ${token}`,
    }
  });

  if (!resp.ok) {
    const twitchError = await resp.json() as TwitchError;
    return { error: twitchError };
  }

  const data = await resp.json() as TokenVerifyResponse;
  return { success: data };
};

const refreshToken = async (
  refreshToken: string, clientId: string, clientSecret: string
):Promise<TwitchResult<TokenRefreshResponse>> => {
  const resp = await apiClient({
    url: 'https://id.twitch.tv/oauth2/token',
    method: 'POST',
    body: {
      'client_id': clientId,
      'client_secret': clientSecret,
      'grant_type': 'refresh_token',
      'refresh_token': refreshToken
    }
  });

  if (!resp.ok) {
    const error = await resp.json() as TwitchError;
    return { error };
  }

  const data = await resp.json() as TokenRefreshResponse;
  return { success: data };
};

const revokeToken = async (
  tokenToRevoke: string, clientId: string
): Promise<TwitchResult<boolean>> => {
  const resp = await apiClient({
    url: 'https://id.twitch.tv/oauth2/revoke',
    method: 'POST',
    body: {
      'client_id': clientId,
      'token': tokenToRevoke
    }
  });

  // 400 means token is no longer valid so might have already been revoked
  if (resp.ok || resp.status == 400)
  {
    return { success: true };
  }

  const error = await resp.json() as TwitchError;
  return { error };
};

export const TwitchApi = {
  authenticateCode,
  refreshToken,
  revokeToken,
  verifyToken,
  getUserInfo
};
