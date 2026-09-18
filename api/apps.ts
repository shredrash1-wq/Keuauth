import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
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

  const backendUrl = 
    process.env.REDZONE_BACKEND_URL || 
    'https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app';

  try {
    const targetUrl = `${backendUrl}/api/v1/apps`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await apiResponse.json();
    return res.status(apiResponse.status).json(data);
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      message: `Failed to proxy applications request: ${err.message || 'Network error'}`
    });
  }
}
