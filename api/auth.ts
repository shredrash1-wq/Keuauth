import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // Enable CORS headers for Vercel and cross-origin requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed. Only POST is supported.' });
  }

  // Parse body safely
  let bodyData: any = req.body;
  if (typeof bodyData === 'string') {
    try {
      bodyData = JSON.parse(bodyData);
    } catch {
      bodyData = {};
    }
  }
  bodyData = bodyData || {};

  const { type, key, username, password, hwid, name, ownerid, version } = bodyData;

  // Cloud Run Redzone authentication backend endpoint
  const authEndpoint = 
    process.env.REDZONE_AUTH_ENDPOINT || 
    process.env.REDZONE_API_URL || 
    'https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth';
  
  // App credentials stored securely server-side without frontend exposure
  const appName = name || process.env.REDZONE_APP_NAME || 'Redzone';
  const appOwnerId = ownerid || process.env.REDZONE_OWNER_ID || 'usr_yedagf';
  const appSecret = process.env.REDZONE_APP_SECRET || 'rz_sec_redzone_secret_key';
  const appVersion = version || process.env.REDZONE_APP_VERSION || '1.0.0';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const apiResponse = await fetch(authEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        type: type || 'license',
        key: key ? String(key).trim() : undefined,
        username: username ? String(username).trim() : undefined,
        password: password ? String(password) : undefined,
        name: appName,
        ownerid: appOwnerId,
        secret: appSecret,
        version: appVersion,
        hwid: hwid || 'BROWSER_CLIENT_HWID'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = apiResponse.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await apiResponse.json();
      return res.status(apiResponse.status).json(data);
    } else {
      const text = await apiResponse.text();
      if (!apiResponse.ok) {
        return res.status(apiResponse.status).json({
          success: false,
          message: `Redzone authentication server error (${apiResponse.status}): ${text.substring(0, 100) || 'Server response error'}`
        });
      }
      return res.status(200).json({ success: true, message: text });
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    const errorDetails = isTimeout ? 'Connection timed out after 10s' : (err.message || 'Network error');
    
    return res.status(502).json({
      success: false,
      message: `Unable to connect to Redzone authentication server: ${errorDetails}`
    });
  }
}

