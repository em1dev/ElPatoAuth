import { z } from 'zod';
import { app, handleError } from '../..';
import { BadRequest } from '../../errors';
import { connectAccountHandler } from './handlers/connectAccountHandler';
import { ConnectionType } from '../../repository/types';
import { deleteUserConnectionHandler } from './handlers/deleteUserConnectionHandler';
import { userConnectionsHandler } from './handlers/userConnectionsHandler';
import { revokeConnectionTokenHandler } from './handlers/revokeConnectionTokenHandler';

/**
 * Add a connection to a user
 */
app.post('/:appId/user/:userId/connection/:connectionTypeId', async (req, res) => {
  try {
    const { code, redirectUrl } = z.object({
      code: z.string(),
      redirectUrl: z.string()
    }).parse(req.body);

    const appId = req.params.appId.toLowerCase();
    const connectionType = z.enum(ConnectionType).parse(req.params.connectionTypeId.toLowerCase());
    const userId = Number.parseInt(req.params.userId);

    if (isNaN(userId)) throw new BadRequest('user id is not valid');

    await connectAccountHandler(code, appId, userId, connectionType, redirectUrl);
    res.status(201).send();
  } catch (err) {
    handleError(err, req, res);
  }
});

/**
 * Delete a connection from a user
 */
app.delete('/:appId/user/:userId/connection/:connectionTypeId', async (req, res) => {
  try {
    const appId = req.params.appId.toLowerCase();
    const connectionType = z.enum(ConnectionType).parse(req.params.connectionTypeId.toLowerCase());
    const userId = Number.parseInt(req.params.userId);

    if (isNaN(userId)) throw new BadRequest('user id is not valid');

    await deleteUserConnectionHandler(userId, appId, connectionType);

    res.status(200).send();
  } catch (err) {
    handleError(err, req, res);
  }
});

/**
 * Revoke access token from a connection
 */
app.delete('/:appId/user/:userId/connection/:connectionTypeId/revoke', async (req, res) => {
  try {
    const appId = req.params.appId.toLowerCase();
    const connectionType = z.enum(ConnectionType).parse(req.params.connectionTypeId.toLowerCase());
    const userId = Number.parseInt(req.params.userId);

    if (isNaN(userId)) throw new BadRequest('user id is not valid');

    await revokeConnectionTokenHandler(userId, appId, connectionType);

    res.status(200).send();
  } catch (err) {
    handleError(err, req, res);
  }
});


/**
 * Get a connection from a user
 */
app.get('/:appId/user/:userId/connections', async (req, res) => {
  try {
    const appId = req.params.appId.toLowerCase();
    const userId = Number.parseInt(req.params.userId);

    if (isNaN(userId)) throw new BadRequest('invalid user id');

    const connections = await userConnectionsHandler(appId, userId);
    res.json(connections);
  } catch (err) {
    handleError(err, req, res);
  }
});