export interface TokenUser {
  app: string;
  id: number;
  provider: {
      type: string;
      userId: string;
      userLogin: string;
  }
}