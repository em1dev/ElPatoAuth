import { apiClient } from '../apiClient';
import { TokenCodeResponse, TokenRefreshResponse, TokenVerifyResponse } from './types';

interface TwitchError {
  status: number,
  message: string
}

export interface TwitchResult<T> {
  error?: TwitchError,
  success?: T
}

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

export const TwitchApi = {
  authenticateCode,
  refreshToken,
  verifyToken
};