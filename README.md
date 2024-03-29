# El Pato Auth

A authentication microservice for ElPato Apps. Its service agnostic and should work with TikTok, Twitch and Google Auth (pending).


*This service is meant to work with other ElPato Services and should not be exposed to the public network*


## Endpoints

### Pato Apps

Get app services

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

Create or update application external services
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

### Authentication

Authenticate (creates an account if it does not exists on db)
```
POST /:appId/authenticate/:externalServiceId
Content-Type: application/json

{
  "code": string,
  "redirectUrl": string
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

Verify token
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

### Connections


Create a connection
```
POST /:appId/user/:userId/connection/:connectionId
Content-Type: application/json

{
  code: string,
  redirectUrl: string
}

// Response
201
```


Get a user connections
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

Delete a user connection
```
DELETE /:appId/user/:userId/connection/:connectionId

// Response
200
```