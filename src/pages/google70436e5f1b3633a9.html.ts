export async function GET() {
  return new Response('google-site-verification: google70436e5f1b3633a9.html', {
    headers: { 'Content-Type': 'text/html' },
  });
}
