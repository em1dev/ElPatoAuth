import { URLSearchParams } from 'url';
import { ChannelInformation, ChannelInformationResponse, GoogleApiError, GoogleRefreshTokenResponse, GoogleTokenResponse, InternalGoogleApiResult } from './types';
import { logger } from '../../logger';
import { daysInSeconds, RedisCache } from '../../cache';

const getYoutubeChannelCacheKey = (channelId: string) => `youtube-channel-id-${channelId}`;
const getYoutubeChannel = async (
  token: string,
  channelId?: string
):Promise<InternalGoogleApiResult<ChannelInformation>> => {
  const cacheStore = RedisCache.getInstance();

  if (channelId)
  {
    const cachedData = await cacheStore.getItem<ChannelInformation>(getYoutubeChannelCacheKey(channelId));
    if (cachedData) {
      return { success: cachedData, hasError: false };
    }
  }

  const params = new URLSearchParams({
    part: 'status,id,snippet',
    mine: 'true',
  });
  const url = 'https://www.googleapis.com/youtube/v3/channels?' + params.toString();
  const resp = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!resp.ok)
  {
    const data = await resp.json() as GoogleApiError;
    const hasExceededQuota = data.error.errors.findIndex(e => e.reason == 'quotaExceeded') != -1;
    if (hasExceededQuota)
    {
      logger.error('Youtube api quota exceeded!');
      return { error: 'QuotaExceeded', hasError: true };
    }
    logger.error(data);
    return { error: 'BadRequest', hasError: true };
  }

  const data = await resp.json() as ChannelInformationResponse;
  const channel = data.items.at(0);
  if (channel) {
    await cacheStore
      .setItem<ChannelInformation>(
        getYoutubeChannelCacheKey(channel.id),
        channel,
        daysInSeconds(1)
      );
    return { success: channel, hasError: false };
  }

  return { error: 'NotFound', hasError: true };
};

const authenticateCode = async (
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) => {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });
  const url = 'https://oauth2.googleapis.com/token?' + params.toString();

  const resp = await fetch(url, {
    method: 'POST'
  });

  if (!resp.ok) {
    logger.info(await resp.text());
    return;
  }

  return await resp.json() as GoogleTokenResponse;
};

const refreshToken = async (
  refreshToken: string,
  clientId: string,
  clientSecret: string,
) =>
{
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });
  const url = 'https://oauth2.googleapis.com/token?' + params.toString();

  const resp = await fetch(url, {
    method: 'POST'
  });

  if (!resp.ok){
    logger.info(await resp.text());
    return;
  }

  return await resp.json() as GoogleRefreshTokenResponse;
};

const revokeToken = async (token: string) => {
  const url = `https://oauth2.googleapis.com/revoke?token=${token}`;
  const resp = await fetch(url, {
    method: 'POST'
  });

  if (resp.ok)
    return true;

  try {
    const err = await resp.json();
    logger.info(err, 'Failed google revoke api');
  } catch {
    logger.info('Failed google revoke api');
  }
  return false;
};

export const googleApi = {
  authenticateCode,
  refreshToken,
  revokeToken,
  getYoutubeChannel
};
