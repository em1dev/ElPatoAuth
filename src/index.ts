import express, { Request, Response } from 'express';
import { Config } from './config';
import { Repository }  from './repository';
import { authenticationHandler } from './handlers/authenticationHandler';
import { connectAccountHandler } from './handlers/connectAccountHandler';
import { BadRequest, HttpErrorBase } from './errors';
import { userConnectionsHandler } from './handlers/userConnectionsHandler';
import { deleteUserConnectionHandler } from './handlers/deleteUserConnectionHandler';

const repository = new Repository();
const app = express();

app.use('/', (req, _, next) => {
  console.log(`[${req.method}] - ${req.path}`);
  next();
});

app.get('/:appId/authenticate/:providerId', async (req, res) => {
  try {
    const code = req.query['code'];
    if (!code || typeof code !== 'string') throw new BadRequest('missing code');
    const appId = req.params.appId.toLowerCase();
    const providerId = req.params.providerId.toLowerCase();

    const user = await authenticationHandler(code, appId, providerId, repository);
    res.json(user);
  } catch(err) {
    handleError(err, req, res);
  }
});

app.post('/:appId/user/:userId/connection/:connectionTypeId', async (req, res) => {
  try {
    const appId = req.params.appId.toLowerCase();
    const connectionType = req.params.connectionTypeId.toLowerCase();
    const userId = Number.parseInt(req.params.userId);
    const code = req.query['code']

    if (!code || typeof code !== 'string') throw new BadRequest('missing code');
    if (!connectionType) throw new BadRequest('missing connection type');
    if (isNaN(userId)) throw new BadRequest('user id is not valid');

    await connectAccountHandler(code, appId, userId, connectionType, repository);
    res.status(201).send();
  } catch (err) {
    handleError(err, req, res);
  }
});

app.delete('/:appId/user/:userId/connection/:connectionTypeId', async (req, res) => {
  try {
    const appId = req.params.appId.toLowerCase();
    const connectionType = req.params.connectionTypeId.toLowerCase();
    const userId = Number.parseInt(req.params.userId);

    if (!connectionType) throw new BadRequest('missing connection type');
    if (isNaN(userId)) throw new BadRequest('user id is not valid');

    await deleteUserConnectionHandler(userId, appId, connectionType, repository);

    res.status(200).send();
  } catch (err) {
    handleError(err, req, res);
  }
});

app.get('/:appId/user/:userId/connections', async (req, res) => {
  try {
    const appId = req.params.appId.toLowerCase();
    const userId = Number.parseInt(req.params.userId);

    if (isNaN(userId)) throw new BadRequest('invalid user id');

    const connections = await userConnectionsHandler(appId, userId, repository);
    res.json(connections);
  } catch (err) {
    handleError(err, req, res);
  }
});

const handleError = (err: unknown, req: Request, res:Response) => {
  console.error(err);
  if (err instanceof HttpErrorBase) {
    res.status(err.statusCode);
    res.send(err.message);
    return;
  }
  res.status(500);
  res.send('Internal error');
};

// gets a guid + token from a twitch token
app.listen(Config.PORT, () => {
  console.log(`Server started at http://localhost:${Config.PORT}`);
});