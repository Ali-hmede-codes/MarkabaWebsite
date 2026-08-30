import type { NextApiRequest, NextApiResponse } from 'next';
import { INTERNAL_BACKEND_ORIGIN } from '../../../lib/api/config';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

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
    const headers: Record<string, string> = {
      Accept: req.headers.accept || 'application/json',
    };

    if (req.headers['content-type']) {
      headers['Content-Type'] = String(req.headers['content-type']);
    }
    if (req.headers.authorization) {
      headers.Authorization = String(req.headers.authorization);
    }
    if (req.headers.cookie) {
      headers.Cookie = String(req.headers.cookie);
    }
    if (req.headers['user-agent']) {
      headers['User-Agent'] = String(req.headers['user-agent']);
    }

    const method = req.method || 'GET';
    const fetchOptions: RequestInit = { method, headers };

    if (method !== 'GET' && method !== 'HEAD') {
      const body = await readRawBody(req);
      if (body.length) {
        headers['Content-Length'] = String(body.length);
        fetchOptions.body = body;
      }
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

    const buffer = Buffer.from(await response.arrayBuffer());
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    return res.status(response.status).send(buffer);
  } catch (error) {
    console.error('API v2 proxy error:', backendUrl, error);
    return res.status(502).json({
      success: false,
      message: 'Unable to reach the API server',
    });
  }
}
