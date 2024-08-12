import { z } from 'zod';
import { app, handleError } from '../..';
import { authenticationHandler } from './handlers/authenticationHandler';
import { LoginProviderType } from '../../repository/types';
import { verifyToken } from '../../jwtService';
import { passwordAuthenticationHandler } from './handlers/passwordAuthenticationHandler';
import { createPasswordAuthenticatedUserHandler } from './handlers/createPasswordAuthenticatedUserHandler';

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
    const token = await authenticationHandler(code, appId, providerId, redirectUrl);

    res.json({ token });
  } catch(err) {
    handleError(err, req, res);
  }
});

app.post('/:appId/createPasswordAuthenticatedUser', async (req, res) => {
  try {
    const { email, password, } = z.object({
      email: z.string().email(),
      password: z.string().min(3),
    }).parse(req.body);
    const appId = req.params.appId.toLowerCase();
    const result = await createPasswordAuthenticatedUserHandler(email, password, appId);
    res.status(201).json({ id: result });
  } catch (err) {
    handleError(err, req, res);
  }
});

app.post('/:appId/authenticate', async (req, res) => {
  try {
    const { email, password, } = z.object({
      email: z.string().email(),
      password: z.string().min(3),
    }).parse(req.body);
    const appId = req.params.appId.toLowerCase();
    const token = await passwordAuthenticationHandler(email, password, appId);

    res.json({ token });
  } catch (err) {
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