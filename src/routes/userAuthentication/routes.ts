import { z } from 'zod';
import { app, handleError } from '../..';
import { authenticationHandler } from './handlers/authenticationHandler';
import { LoginProviderType } from '../../repository/types';

/**
 * Authenticate an user with a login provider
 */
app.post('/:appId/authenticate/:providerId', async (req, res) => {
  try {
    const { code, redirectUrl } = z.object({
      code: z.string(),
      redirectUrl: z.string()
    }).parse(req.body);
    const appId = req.params.appId.toLowerCase();
    const providerId = z.nativeEnum(LoginProviderType).parse(req.params.providerId.toLowerCase());
    const user = await authenticationHandler(code, appId, providerId, redirectUrl);
    res.json(user);
  } catch(err) {
    handleError(err, req, res);
  }
});