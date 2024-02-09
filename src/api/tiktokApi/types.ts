export interface TikTokAuthorizationResponse {
  /**
   * user id
   */
  open_id: string,
  /**
   * comma seperated scope
   */
  scope: string
  access_token: string,
  expires_in: number,
  refresh_token: string,
  refresh_expires_in: string,
}