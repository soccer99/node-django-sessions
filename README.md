# node-django-sessions

A small TypeScript/Node.js library. It reads and writes Django session data. Use it when a Django service and a Node.js service must share one login.

[![npm version](https://badge.fury.io/js/node-django-sessions.svg)](https://badge.fury.io/js/node-django-sessions)
[![Django 4.2 | 5.2 | 6.1](https://img.shields.io/badge/Django-4.2%20%7C%205.2%20%7C%206.1-092E20?logo=django&logoColor=white)](tests/fixtures)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Reads Django session data in Node.js
- Writes session data that Django can read
- Has TypeScript types
- Supports compressed and uncompressed session data
- Works with Express.js middleware
- Accepts a custom secret key and salt
- Runs in Node.js, Deno, and Bun

## Installation

```bash
npm install node-django-sessions
# or
yarn add node-django-sessions
```

## Usage

### Read a session (Django to Node)

```typescript
import { decodeSession } from 'node-django-sessions';

// The session_data column from the django_session table
const sessionData = "your_session_data_here";

try {
  const sessionInfo = await decodeSession(sessionData, {
    secretKey: 'your_django_secret_key'
  });

  console.log(sessionInfo);
  // Output:
  // {
  //   _auth_user_backend: "django.contrib.auth.backends.ModelBackend",
  //   _auth_user_hash: "test",
  //   _auth_user_id: "1",
  //   test: "test"
  // }
} catch (error) {
  console.error('Failed to decode session:', error);
}
```

### Write a session (Node to Django)

```typescript
import { createSession } from 'node-django-sessions';

// Store the result in the django_session table. Django can read it.
const sessionData = await createSession(
  { _auth_user_id: '1', _auth_user_backend: 'django.contrib.auth.backends.ModelBackend' },
  { secretKey: 'your_django_secret_key' }
);
```

The output is the same as `django.core.signing.dumps(..., compress=True)`. It has four parts:

1. JSON data, in base64url
2. zlib compression, only if it makes the data smaller
3. A base62 timestamp
4. An HMAC-SHA256 signature

### Express middleware example

```typescript
import { decodeSession } from 'node-django-sessions';
import express from 'express';

const app = express();

const djangoSessionMiddleware = async (req: any, res: any, next: any) => {
  try {
    const sessionId = req.cookies['sessionid'];  // or the location of your session ID

    // TODO: Get the session data from your store (for example Redis or a database)
    const sessionData = await getSessionData(sessionId);
    if (!sessionData) {
      return res.status(401).json({ error: 'No session provided' });
    }

    const session = await decodeSession(sessionData);

    // TODO: Get the user from your database with session._auth_user_id
    const user = await getUserById(session._auth_user_id);
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid session' });
  }
};

app.use(djangoSessionMiddleware);
```

## Configuration

`decodeSession` and `createSession` accept these options:

```typescript
interface SessionOptions {
  secretKey?: string;  // The Django SECRET_KEY. You can also set the DJANGO_SECRET_KEY env var.
  salt?: string;       // A custom salt, if your Django config uses one
}
```

### Environment variables

- `DJANGO_SECRET_KEY`: The secret key of your Django project. Set it here if you do not pass it in the options.

## Runtime compatibility

The library runs in these runtimes. The tests check each one.

| Runtime | Tested with |
| --- | --- |
| Node.js | 26 |
| TypeScript | 5.7 |
| Deno | 2.1 |
| Bun | 1.4 |

Deno note: The library imports `Buffer` from `node:buffer`. You do not need the `--unstable-node-globals` flag.

To run the runtime tests, you must have Node.js, Deno, and Bun installed. Then run:

```bash
npm run test:runtimes
```

## Django compatibility

The tests compare the output byte for byte with sessions made by Django 4.2, 5.2, and 6.1. The Django sessions are in `tests/fixtures/`.

To make the fixtures again, you must have [uv](https://docs.astral.sh/uv/). Then run:

```bash
sh tests/fixtures/gen.sh
```

## Contributing

Pull requests are welcome.

## License

MIT

## Credits

Made to connect Django and Node.js applications in a microservice architecture.
