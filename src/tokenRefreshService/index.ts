import { TikTokApi } from '../api/tiktokApi';
import { TwitchApi } from '../api/twitchApi';
import { ExternalServiceDto } from '../repository/appRepository';
import { ConnectionType } from '../repository/types';

export interface RefreshTokenResult {
  token: string,
  refreshToken: string,
  expiresIn: number,
  expiresAt: number
}

const calculateExpiryDate = (expiresIn: number) => {
  const expiresInMs = expiresIn * 1000;
  const expiresAt = Date.now() + expiresInMs;
  return expiresAt;
};

const getRefreshToken = async (
  service: ExternalServiceDto,
  type: ConnectionType,
  refreshToken: string
): Promise<RefreshTokenResult | null> => {
  if (type === ConnectionType.tiktok) {
    const data = await TikTokApi.refreshToken(refreshToken, service.clientId, service.clientSecret);
    if (data.error) {
      console.error(data);
      console.error(`Error refreshing token for service ${type}`);
      return null;
    }
    return {
      expiresIn: data.success.expires_in,
      refreshToken: data.success.refresh_token,
      token: data.success.access_token,
      expiresAt: calculateExpiryDate(data.success.expires_in)
    };
  }

  if (type === ConnectionType.twitch) {
    const data = await TwitchApi.refreshToken(refreshToken, service.clientId, service.clientSecret);
    if (data.error){
      console.error(data);
      console.error(`Error refreshing token for service ${type}`);
      return null;
    }
    return {
      expiresIn: data.success.expires_in,
      refreshToken: data.success.refresh_token,
      token: data.success.access_token,
      expiresAt: calculateExpiryDate(data.success.expires_in)
    };
  }

  throw new Error('not implemented');
};

export const TokenRefreshService = {
  getRefreshToken,
  calculateExpiryDate
};