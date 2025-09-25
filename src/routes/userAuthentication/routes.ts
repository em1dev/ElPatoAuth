import { z } from 'zod';
import { app, handleError } from '../..';
import { authenticationHandler } from './handlers/authenticationHandler';
import { LoginProviderType } from '../../repository/types';
import { verifyToken } from '../../jwtService';

/**
 * Authenticate an user with a login provider
 */
app.post('/:appId/authenticate/:providerId', async (req, res) => {
  try {
    const { code, redirectUrl, shouldUpsertConnection } = z.object({
      code: z.string(),
      redirectUrl: z.string(),
      shouldUpsertConnection: z.boolean().optional()
    }).parse(req.body);

    const appId = req.params.appId.toLowerCase();
    const providerId = z.enum(LoginProviderType).parse(req.params.providerId.toLowerCase());
    const token = await authenticationHandler(code, appId, providerId, redirectUrl, shouldUpsertConnection);

    res.json({ token });
  } catch(err) {
    handleError(err, req, res);
  }
});

app.post('/token/verify', async (req, res) => {
  try {
    const { token } = z.object({
      token: z.string(),
    }).parse(req.body);
    const result = await verifyToken(token);
    if (!result) {
      return res.status(403).send();
    }
    return res.status(200).send();
  } catch (err) {
    handleError(err, req, res);
  }
});