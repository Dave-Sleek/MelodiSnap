export const config = {
  runtime: 'edge',
};

export default async function handler() {
  return new Response(
    JSON.stringify({
      app: 'melodisnap',
      status: 'online',
      endpoints: [
        { path: '/api/recognize', method: 'POST', description: 'AudD song recognition proxy' },
        { path: '/api/health', method: 'GET', description: 'Health and service configuration check' },
      ],
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
