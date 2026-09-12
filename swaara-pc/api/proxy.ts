export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-YouTube-Client-Name, X-YouTube-Client-Version, X-Goog-Api-Format-Version, X-YouTube-Identity-Token, Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
};

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';
const CONSENT_COOKIE =
  'SOCS=CAESEwgDEgk2OTc3NjExMDUaAmVuIAEaBgiA_K-0Bg; CONSENT=PENDING+999';

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  try {
    const reqUrl = new URL(req.url);
    let targetUrl = reqUrl.searchParams.get('url');

    // Fallback: check endpoint parameter or path rewrite
    if (!targetUrl) {
      const endpoint = reqUrl.searchParams.get('endpoint');
      if (endpoint) {
        const extraParams = new URLSearchParams();
        reqUrl.searchParams.forEach((value, key) => {
          if (key !== 'endpoint' && key !== 'url') {
            extraParams.append(key, value);
          }
        });
        const extra = extraParams.toString();
        targetUrl = extra
          ? (endpoint.includes('?') ? `${endpoint}&${extra}` : `${endpoint}?${extra}`)
          : endpoint;
      } else if (reqUrl.pathname.startsWith('/yt-api/')) {
        const path = reqUrl.pathname.replace(/^\/yt-api\//, '');
        targetUrl = `https://www.youtube.com/${path}${reqUrl.search}`;
      } else if (reqUrl.pathname.startsWith('/yti-api/')) {
        const path = reqUrl.pathname.replace(/^\/yti-api\//, '');
        targetUrl = `https://youtubei.googleapis.com/${path}${reqUrl.search}`;
      }
    }

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing target URL parameter (e.g. ?url=...)' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare headers for upstream request
    const forwardHeaders: Record<string, string> = {
      'User-Agent': req.headers.get('user-agent') || DEFAULT_USER_AGENT,
      'Accept': req.headers.get('accept') || '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://www.youtube.com',
      'Referer': 'https://www.youtube.com/',
      'Cookie': CONSENT_COOKIE,
    };

    // Forward specific YouTube/Google headers if present
    const headersToForward = [
      'content-type',
      'x-youtube-client-name',
      'x-youtube-client-version',
      'x-goog-api-format-version',
      'x-youtube-identity-token',
      'range',
    ];

    for (const h of headersToForward) {
      const val = req.headers.get(h);
      if (val) forwardHeaders[h] = val;
    }

    const init: RequestInit = {
      method: req.method,
      headers: forwardHeaders,
      redirect: 'follow',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.arrayBuffer();
      if (body.byteLength > 0) {
        init.body = body;
      }
    }

    const upstreamResponse = await fetch(targetUrl, init);

    // Build response headers
    const responseHeaders = new Headers(CORS_HEADERS);
    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }
    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const responseBody = await upstreamResponse.arrayBuffer();

    return new Response(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'Proxy request failed',
        message: err?.message || String(err),
      }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}
