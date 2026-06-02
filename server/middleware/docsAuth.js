import crypto from 'crypto';

function safeCompare(a, b) {
  const left = Buffer.from(a || '', 'utf8');
  const right = Buffer.from(b || '', 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function docsAuth(req, res, next) {
  const expectedUser = process.env.API_DOCS_USER;
  const expectedPassword = process.env.API_DOCS_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return res.status(503).json({ error: 'API docs are not configured' });
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="SmartTodo API Docs"');
    return res.status(401).send('Authentication required');
  }

  let username = '';
  let password = '';

  try {
    const decoded = Buffer.from(auth.slice('Basic '.length), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
      throw new Error('Invalid basic auth payload');
    }

    username = decoded.slice(0, separatorIndex);
    password = decoded.slice(separatorIndex + 1);
  } catch {
    res.setHeader('WWW-Authenticate', 'Basic realm="SmartTodo API Docs"');
    return res.status(401).send('Invalid credentials');
  }

  if (!safeCompare(username, expectedUser) || !safeCompare(password, expectedPassword)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="SmartTodo API Docs"');
    return res.status(401).send('Invalid credentials');
  }

  next();
}
