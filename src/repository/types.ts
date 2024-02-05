export interface UserInstantLogin {
  loginCode: string,
  login: string,
  twitchId: string,
  twitchToken: string,
  twitchRefreshToken: string,
  expiresAt: number,
  scopes: Array<string>
}