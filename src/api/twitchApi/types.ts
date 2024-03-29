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

export interface UserDetails {
  id: string,
  login: string,
  display_name: string,
  type: 'admin' | 'global_mod' | 'staff' | '',
  broadcaster_type: 'partner' | 'affiliate' | '',
  description: string,
  profile_image_url: string,
  offline_image_url: string,
  view_count: number,
  email: string,
  created_at: string
}