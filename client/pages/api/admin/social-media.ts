import { NextApiRequest, NextApiResponse } from 'next';

import { API_BASE_URL } from '../../../lib/api/config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body, query } = req;
  const { id } = query;

  try {
    let backendUrl = `${API_BASE_URL}/social-media`;

    if (id) {
      backendUrl += `/${id}`;
    } else if (method === 'GET') {
      backendUrl += '/admin';
    }

    const token = req.cookies.token;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === 'POST' || method === 'PUT') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(backendUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}