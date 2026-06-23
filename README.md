# 🪪 Authentication Service 

A service agnostic authentication micro-server with TikTok and Twitch auth integration.


*This service is meant to work behind a firewall and should not be exposed to the public network. Instead a separate public facing api should interact with this service.*

# Used by

⭐ [Stream Chat Overlay](https://github.com/em1dev/StreamChatOverlay)

⭐ [Pato Clip](https://github.com/em1dev/ElPatoClip)

# ⛏️ Usage

Start development server
```bash
pnpm dev
```

Run production server
```bash
pnpm build
pnpm start
```
Or with docker compose
```bash
docker compose build
docker compose up
```

**Make sure to run migrations to create or migrate the db**
```bash
pnpm build
pnpm migrate
```

# 🗒️ Requirements

This service uses redis. A connection string to the redis instance must be included in the .env file.

A .env file with the following keys is required

```.env
PORT={{ PORT }}
ENCRYPTION_KEY={{ ENCRYPTION_KEY }}
SQLITE_DB_PATH={{ SQLITE_DB_PATH }}
TOKEN_ISSUER={{ TOKEN_ISSUER }}
REDIS_URL={{ REDIS_URL }}
```

# 📖 Endpoints

## Apps
An app represent an application interacting with the Auth service. An app contains multiple external services for authenticating and connecting like tiktok or twitch.

### Get apps

```ts
GET /app

// Response
200
[
  {
    id: string,
  }
]
```

### Get app services

```ts
GET /app/:appId

// Response
200
[
  {
    type: string,
    clientSecret: string,
    clientId: string
  }
]
```

### Create or update application external services
```ts
POST /app/:appId

[
  {
    type: string,
    clientSecret: string,
    clientId: string
  }
]

// Response
201
```

## Authentication

### Get service authentication url
```ts
POST /:appId/authenticate/authUrl
Content-Type: application/json

{
  redirectUrl: string,
  scopes: Array<string>
}

// Response
200
{
  authUrl: string
}
```

### Authenticate
Creates an account if it does not exists on db.

If `shouldUpsertConnection` is set to true then it will also create a connection to the equivalent service or update a connection if it exists. So in the case you require to hold an access token for the same service you authenticate, this should save you having to re-authenticate the user to add a connection.
```ts
POST /:appId/authenticate/:externalServiceId
Content-Type: application/json

{
  code: string,
  redirectUrl: string,
  shouldUpsertConnection?: boolean
}

// Response
200
{
  token: string // jwt token
}

// The response jwt will have the following format:

user: {
  app: string,
  id: number,
  provider: {
    type: string,
    userId: string,
    userLogin: string,
    profileImageUrl: string,
    displayName: string
  }
}

```

### Verify token
```ts
POST /token/verify
Content-Type: application/json

{
  token: string
}

// Response
200
401 - When token is not valid
```

## Connections


### Create a connection
```ts
POST /:appId/user/:userId/connection/:connectionTypeId
Content-Type: application/json

{
  code: string,
  redirectUrl: string
}

// Response
201
```


### Get user connections
```ts
GET /:appId/user/:userId/connections

// Response 
200
[{ 
  displayName: string,
  profileImageUrl: string,
  refreshToken: string,
  token: string,
  type: 'tiktok' | 'twitch' | 'youtube',
  userId: string,
  expiresInMs: number
}]
```

### Delete a user connection
```ts
DELETE /:appId/user/:userId/connection/:connectionTypeId

// Response
200
```

### Revoke connection token.

This invalidates the current access_token and refreshes the token in the database. This should be called in the unfortunate case of leaking the access_token.
```ts
DELETE /:appId/user/:userId/connection/:connectionTypeId/revoke

// Response
200
```
