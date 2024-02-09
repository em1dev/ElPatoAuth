export interface TokenVerifyResponse {
  'client_id': string,
  'user_id': string,
  'expires_in': number
  login: string,
  scopes: Array<string>
}

export interface TokenCodeResponse {
  'access_token': string,
  'expires_in': number,
  'refresh_token': string,
  'token_type': 'bearer',
  scope: Array<string>
}

export interface TokenRefreshResponse {
  'access_token': string,
  'refresh_token': string,
  'scope': Array<string>,
  'token_type': 'bearer',
}