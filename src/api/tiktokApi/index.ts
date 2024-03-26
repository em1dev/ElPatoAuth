import { ZodError, z } from 'zod';

interface TikTokError {
  code: string,
  message: string,
  log_id: string
}

const getUserInfo = async (token: string) => {
  
  const fields = [
    // user.info.basic
    'open_id', 'avatar_url', 'display_name', 'bio_description',
    // user.info.profile
    'profile_deep_link', 'username'
  ];

  const resp = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields.concat(',')}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!resp.ok) {
    const err = await resp.text();
    return { error: err };
  }

  const data = await resp.json() as {
    data: {
      user: {
        open_id: string,
        avatar_url: string,
        display_name: string,
        bio_description: string,
        profile_deep_link: string,
        username: string
      }
    },
    error: TikTokError
  };

  if (data.error.code == 'ok') {
    return {
      success: data.data.user
    };
  }

  return {
    error: data.error
  };
};

const refreshToken = async (refreshToken: string, clientKey: string, clientSecret: string) => {

  const body = new URLSearchParams({
    'client_key': clientKey,
    'client_secret': clientSecret,
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken
  });

  const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    body
  });

  if (!resp.ok) {
    const error = await resp.json() as TikTokError;
    return { error };
  }

  const data = await resp.json();
  return unwrapAuthResponse(data);
};

const authenticateWithCode = async (code: string, clientKey: string, clientSecret: string, redirectUrl: string) => {
  const body = new URLSearchParams({
    'client_key': clientKey,
    'client_secret': clientSecret,
    'grant_type': 'authorization_code',
    code,
    redirect_uri: redirectUrl,
  });

  const resp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    body
  });

  if (!resp.ok) {
    const error = await resp.text();
    return { error };
  }

  const data = await resp.json();
  return unwrapAuthResponse(data);
};

const unwrapAuthResponse = (obj: unknown) => {
  try {
    const authResponseValidator = z.object({
      access_token: z.string(),
      expires_in: z.number(),
      open_id: z.string(),
      refresh_expires_in: z.number(),
      refresh_token: z.string(),
      scope: z.string(),
    });
    return { success: authResponseValidator.parse(obj) };
  } catch (e) {
    if (!(e instanceof ZodError)) throw e;

    const errorValidator = z.object({
      error: z.string(),
      error_description: z.string(),
      log_id: z.string()
    });
    return { error: errorValidator.parse(obj) };
  }
};

export const TikTokApi = {
  authenticateWithCode,
  refreshToken,
  getUserInfo
};