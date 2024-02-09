export enum Tables {
  user = 'user',
  connection = 'connection',
  provider = 'provider'
}

export type ConnectionType = 'twitch' | 'tiktok' | 'youtube';
export type LoginProvider = 'twitch';

export interface LoggedInUser {
  id: number,
  app: string,
  provider: Omit<Provider, 'id'>
}

export interface User {
  id: number,
  app: string,
  providers: Array<Provider>,
  connections?: Array<Connection>,
}

export interface Connection {
  token: string,
  refreshToken: string
  userId: string,
  type: ConnectionType,
}

export interface Provider {
  id: number,
  userId: string,
  userLogin: string,
  type: LoginProvider,
}