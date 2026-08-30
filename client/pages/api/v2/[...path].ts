import type { NextApiRequest, NextApiResponse } from 'next';
import { INTERNAL_BACKEND_ORIGIN } from '../../../lib/api/config';

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const segments = req.query.path;
  const path = Array.isArray(segments) ? segments.join('/') : String(segments || '');

  const searchParams = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === 'path' || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
    } else {
      searchParams.append(key, value);
    }
  });

  const query = searchParams.toString();
  const backendUrl = `${INTERNAL_BACKEND_ORIGIN}/api/v2/${path}${query ? `?${query}` : ''}`;

  try {
    const headers: HeadersInit = {
      Accept: 'application/json',
    };

    const incomingType = req.headers['content-type'];
    if (incomingType) {
      headers['Content-Type'] = incomingType;
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
    }

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    if (req.headers.cookie) {
      headers.Cookie = req.headers.cookie;
    }
    if (req.headers['user-agent']) {
      headers['User-Agent'] = req.headers['user-agent'];
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    }

    const response = await fetch(backendUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    const text = await response.text();
    return res.status(response.status).send(text);
  } catch (error) {
    console.error('API v2 proxy error:', backendUrl, error);
    return res.status(502).json({
      success: false,
      message: 'Unable to reach the API server',
    });
  }
}
