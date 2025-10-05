# Authentication Service 

A service agnostic authentication micro-server with TikTok and Twitch auth integration.

*This service is meant to work behind a firewall and should not be exposed to the public network. Instead a separate public facing api should interact with this service.*

# Endpoints

## Apps

### Get app services

```
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
```
POST /app/:appId

[
  {
    "type": string,
    "clientSecret": string,
    "clientId": string
  }
]

// Response
201
```

## Authentication

### Authenticate
Creates an account if it does not exists on db.

If `shouldUpsertConnection` is set to true then it will also create a connection to the equivalent service or update a connection if it exists. So in the case you require to hold an access token for the same service you authenticate, this should save you having to re-authenticate the user to add a connection.
```
POST /:appId/authenticate/:externalServiceId
Content-Type: application/json

{
  "code": string,
  "redirectUrl": string,
  "shouldUpsertConnection": z.boolean().optional()
}

// Response
200
{

  token: string // jwt token
}

// A jwt should have the following format:

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
```
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
```
POST /:appId/user/:userId/connection/:connectionTypeId
Content-Type: application/json

{
  code: string,
  redirectUrl: string
}

// Response
201
```


### Get a user connections
```
GET /:appId/user/:userId/connections

// Response 
200
{ 
  token: string,
  refresh_token: string,
  user_id: string,
  type: 'tiktok' | 'twitch' | 'youtube'
}
```

### Delete a user connection
```
DELETE /:appId/user/:userId/connection/:connectionTypeId

// Response
200
```

### Revoke connection token.

This invalidates the current access_token and refreshes the token in the database. This should be called in the unfortunate case of leaking the access_token.
```
DELETE /:appId/user/:userId/connection/:connectionTypeId/revoke
200
```