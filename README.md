# node-django-sessions

A lightweight TypeScript/Node.js library that allows you to decode and use Django session data in your Node.js applications. Perfect for scenarios where you need to share authentication between Django and Node.js services.

[![npm version](https://badge.fury.io/js/node-django-sessions.svg)](https://badge.fury.io/js/node-django-sessions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Decode Django session data in Node.js applications
- TypeScript support out of the box
- Handles both compressed and uncompressed session data
- Easy integration with Express.js middleware
- Supports custom secret keys and salt configurations

## Installation

```bash
npm install node-django-sessions
# or
yarn add node-django-sessions
```

## Usage

### Basic Usage

```typescript
import { decodeSession } from 'node-django-sessions';

// Session data from django_sessions table
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

### Express Middleware Example

```typescript
import { decodeSession } from 'node-django-sessions';
import express from 'express';

const app = express();

const djangoSessionMiddleware = async (req: any, res: any, next: any) => {
  try {
    const sessionId = req.cookies['sessionid'];  // or however you store your session ID

    // TODO: Add your own session data retrieval logic here
    const sessionData = await getSessionData(sessionId);

    if (!sessionData) {
      return res.status(401).json({ error: 'No session provided' });
    }

    const session = await decodeSession(sessionData);
    req.djangoSession = session;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid session' });
  }
};

app.use(djangoSessionMiddleware);
```

## Configuration

The `decodeSession` function accepts the following options:

```typescript
interface SessionOptions {
  secretKey?: string;  // Django's SECRET_KEY (can also be set via DJANGO_SECRET_KEY env var)
  salt?: string;       // Custom salt if your Django config uses one
}
```

### Environment Variables

- `DJANGO_SECRET_KEY`: Your Django project's secret key. This can be used instead of passing the key in options.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Inspired by the need to bridge Django and Node.js applications in modern microservice architectures.
