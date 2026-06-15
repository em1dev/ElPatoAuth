export type GoogleApiErrorReason = 'QuotaExceeded' | 'BadRequest' | 'NotFound';

export type InternalGoogleApiResult<T> = {
  hasError: true,
  error: GoogleApiErrorReason
} | {
  hasError: false,
  success: T
}

export interface GoogleApiError {
  error: {
    code: number,
    message: string,
    errors: Array<{
      message: string,
      domain: 'youtube.quota' | string,
      reason: 'quotaExceeded' | string
    }>
  }
}

export interface GooglePagination<T>
{
  kind: string,
  etag: string,
  pageInfo: {
    totalResults: number,
    resultsPerPage: number
  },
  items: Array<T>
}

export interface GoogleThumbnailImage
{
  url: string,
  width: number,
  height: number
}

export type ChannelInformationResponse = GooglePagination<ChannelInformation>;
export type ChannelInformation = {
  kind: string,
  etag: string,
  id: string,
  snippet: {
    title: string,
    description: string,
    customUrl: string,
    thumbnails: {
      default: GoogleThumbnailImage,
      medium: GoogleThumbnailImage,
      high: GoogleThumbnailImage
    },
  }
};

export interface GoogleTokenResponse
{
  access_token: string,
  expires_in: number, // in seconds
  refresh_token?: string, // only returns the first time
  refresh_token_expires_in?: number // in seconds only if user sets time-based access
  scope: string,
  token_type: 'Bearer'
}

export interface GoogleRefreshTokenResponse
{
  access_token: string,
  expires_in: number,
  scope: string,
  token_type: 'Bearer'
}
