import type { APIRoute } from 'astro';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { checkAuth } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request: request as Request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'video/mp4', 'video/quicktime', 'video/webm',
          'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
        ],
        maximumSizeInBytes: 500 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    });
    return Response.json(response);
  } catch (err) {
    return new Response(String(err), { status: 400 });
  }
};
