import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // Enable CORS for Vercel frontend
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { type, key, username, password, hwid } = req.body;
  const cloudRunUrl = process.env.REDZONE_API_URL || 'https://ais-dev-ykpcumjethdawivfgp4r6k-320139288899.asia-southeast1.run.app/api/v1/client/auth';
  
  const appName = process.env.REDZONE_APP_NAME || 'RedZone Core App';
  const ownerId = process.env.REDZONE_OWNER_ID || 'usr_redzone';

  try {
    const apiResponse = await fetch(cloudRunUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type || 'license',
        key,
        username,
        password,
        name: appName,
        ownerid: ownerId,
        hwid: hwid || 'BROWSER_HWID'
      })
    });

    const data = await apiResponse.json();
    return res.status(apiResponse.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Unable to connect to RedZone authentication server: ${err.message || 'Network error'}`
    });
  }
}
