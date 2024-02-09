import { Config } from "../../config";
import { TikTokAuthorizationResponse } from "./types";

const TIKTOK_CLIENT_KEY = Config.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = Config.TIKTOK_SECRET;

const refreshToken = async (refreshToken: string) => {
  const resp = await baseRequest({
    url: 'https://open-api.tiktok.com/oauth/refresh_token/',
    method: 'POST',
    query: {
      'client_key': TIKTOK_CLIENT_KEY,
      'grant_type': 'refresh_token',
      'refresh_token': refreshToken
    }
  });

  if (!resp.ok) throw new Error('error from tiktok refresh api');

  return await resp.json() as TikTokAuthorizationResponse;
}

const authenticateWithCode = async (code: string) => {
  const resp = await baseRequest({
    url: 'https://open-api.tiktok.com/oauth/access_token',
    method: 'POST',
    query: {
      'client_key': TIKTOK_CLIENT_KEY,
      'client_secret': TIKTOK_CLIENT_SECRET,
      'grant_type': 'authorization_code',
      code
    }
  });

  console.log(resp.status);
  // todo - add error handling
  const data = await resp.json() as TikTokAuthorizationResponse;
  return data;
}

// TODO - move to shared helper
interface RequestOptions {
  url: string,
  query?: Record<string, string | number>,
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: object | null,
  headers?: Record<string, string>,
};

const baseRequest = ({ url, body = null, method = 'GET', query = {}, headers = {}}: RequestOptions) => {
  const urlObject = new URL(url);
  Object.keys(query).forEach((key) => {
    urlObject.searchParams.set(key, query[key].toString());
  });

  return fetch(urlObject, {
    method,
    body: body ? JSON.stringify(body) : null,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  });
}

export const TikTokApi = {
  authenticateWithCode,
  refreshToken
}