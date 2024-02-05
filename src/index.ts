import express from 'express';
import { Config } from './config';
import { authenticationCodeHandler } from './handlers/authenticationCodeHandler';
import { db } from './repository';


const app = express();

app.use('/', (req, res, next) => {
  console.log(`[${req.method}] - ${req.path}`);
  next();
});

app.get('/authenticate', authenticationCodeHandler);

// takes a guid
app.get('/patoInstantLogin/token')

// gets a guid + token from a twitch token
app.get('/user/:userId')

app.get('/token/:token');
app.get('/token/:token/validate');
app.get('/token')

app.listen(Config.PORT, () => {
  console.log(`Server started at http://localhost:${Config.PORT}`);
});