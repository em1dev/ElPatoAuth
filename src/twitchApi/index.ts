import { URL } from "url";
import { Config } from "../config";
import { TokenCodeResponse, TokenRefreshResponse, TokenVerifyResponse } from "./types";

const authenticateCode = async (code: string) => {
  const resp = await baseRequest({
    url: 'https://id.twitch.tv/oauth2/token',
    method: 'POST',
    body: {
      'client_id': Config.TWITCH_CLIENT_ID,
      'grant_type': 'authorization_code',
      'redirect_uri': 'http://localhost:8022/authenticate',
      'client_secret': Config.TWITCH_SECRET,
      code
    }
  });
  const data = await resp.json() as TokenCodeResponse;
  console.log(data);
  return data;
}

const verifyToken = async (token: string) => {
  const resp = await baseRequest({
    url: 'https://id.twitch.tv/oauth2/validate',
    headers: {
      'Authorization': `OAuth ${token}`,
    }
  });
  const data = await resp.json() as TokenVerifyResponse;
  console.log(data);
  return data;
}

const refreshToken = async (refreshToken: string) => {
  const resp = await baseRequest({
    url: 'https://id.twitch.tv/oauth2/token',
    method: 'POST',
    body: {
      'client_id': Config.TWITCH_CLIENT_ID,
      'client_secret': Config.TWITCH_SECRET,
      'grant_type': 'refresh_token',
      'refresh_token': refreshToken
    }
  });

  const data = await resp.json() as TokenRefreshResponse;
  console.log(data);
  return data;
}

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

export const TwitchApi = {
  authenticateCode,
  refreshToken,
  verifyToken
}