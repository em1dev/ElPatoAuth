import { RequestHandler } from "express";
import { TwitchApi } from "../twitchApi";
import { nanoid } from "nanoid";

export const authenticationCodeHandler:RequestHandler<Record<string, any>> = async (req, res, next) => {
  const authCode = req.query['code'];
  if (!authCode || typeof(authCode) !== 'string') {
    res.status(401).send('Missing authentication code');
    return;
  }
  console.log(authCode);
  const { refresh_token, access_token, expires_in, scope } = await TwitchApi.authenticateCode(authCode);
  const { login, user_id } = await TwitchApi.verifyToken(access_token);
  await TwitchApi.refreshToken(refresh_token);
  res.status(200).send();
  /*
  await Repository.insertUserLogin({
    expiresAt: expires_in,
    scopes: scope,
    login,
    twitchId: user_id,
    twitchRefreshToken: refresh_token,
    twitchToken: access_token,
    loginCode: nanoid(20),
  });
  */
}