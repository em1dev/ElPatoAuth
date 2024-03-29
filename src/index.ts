import express, { Request, Response } from 'express';
import { Config } from './config';
import { HttpErrorBase } from './errors';
import { ZodError } from 'zod';

export const app = express();
app.use(express.json());

app.use('/', (req, _, next) => {
  console.log(`[${req.method}] - ${req.path}`);
  next();
});

export const handleError = (err: unknown, req: Request, res:Response) => {
  console.error(err);
  if (err instanceof HttpErrorBase) {
    res.status(err.statusCode);
    res.send(err.message);
    return;
  }
  if (err instanceof ZodError) {
    res.status(400);
    res.send(err.message);
    return;
  }
  res.status(500);
  res.send('Internal error');
};

import './routes/patoApps/routes';
import './routes/userConnections/routes';
import './routes/userAuthentication/routes';

app.listen(Config.PORT, () => {
  console.log(`Server started at http://localhost:${Config.PORT}`);
});

import './scheduler';