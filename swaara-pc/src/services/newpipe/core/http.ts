/**
 * ZenTube Downloader & HTTP Client
 * Handles request spoofing, consent cookies, headers, and visitorData caching
 * Enhanced with automatic Web Browser CORS Proxy & Electron Direct Bypasses
 */

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
}

export class HttpClient {
  private static visitorDataCache: string | null = null;
  private static visitorDataExpiry: number = 0;

  // Default consent cookie to prevent consent redirects
  private static readonly CONSENT_COOKIE = 'SOCS=CAESEwgDEgk2OTc3NjExMDUaAmVuIAEaBgiA_K-0Bg; CONSENT=PENDING+999';

  /**
   * Checks if running inside a standard web browser (as opposed to Electron desktop)
   */
  public static isBrowser(): boolean {
    return typeof window !== 'undefined' && !(window as any).electronAPI?.isElectron;
  }

  /**
   * Resolves target URL:
   * In Electron: Direct YouTube endpoints.
   * In Web Browser (Vite dev/localhost): Routes through Vite's local `/yt-api` and `/yti-api` proxies.
   */
  public static resolveUrl(rawUrl: string): string {
    if (!this.isBrowser()) {
      return rawUrl;
    }

    if (rawUrl.startsWith('https://youtubei.googleapis.com')) {
      return rawUrl.replace('https://youtubei.googleapis.com', '/yti-api');
    }
    if (rawUrl.startsWith('https://www.youtube.com')) {
      return rawUrl.replace('https://www.youtube.com', '/yt-api');
    }

    return rawUrl;
  }

  /**
   * Cleans headers for the execution environment.
   * In a browser, forbidden headers like Cookie, User-Agent, Origin trigger CORS preflight failures.
   */
  private static sanitizeHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const isWeb = this.isBrowser();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (!isWeb) {
      headers['Cookie'] = this.CONSENT_COOKIE;
    } else {
      // Forbidden headers in browser fetch:
      delete headers['Cookie'];
      delete headers['User-Agent'];
      delete headers['Origin'];
      delete headers['Referer'];
    }

    return headers;
  }

  /**
   * Performs an HTTP POST request with JSON payload
   */
  public static async postJson<T = any>(
    url: string,
    body: any,
    options: HttpRequestOptions = {}
  ): Promise<T> {
    const targetUrl = this.resolveUrl(url);
    const headers = this.sanitizeHeaders(options.headers);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: typeof body === 'string' ? body : JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} from ${targetUrl}: ${errorText.slice(0, 300)}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Performs an HTTP GET request
   */
  public static async get(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<string> {
    const targetUrl = this.resolveUrl(url);
    const isWeb = this.isBrowser();

    const headers: Record<string, string> = {};
    if (!isWeb) {
      headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';
      headers['Cookie'] = this.CONSENT_COOKIE;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
      if (isWeb) {
        delete headers['Cookie'];
        delete headers['User-Agent'];
        delete headers['Origin'];
        delete headers['Referer'];
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${targetUrl}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Retrieves or refreshes YouTube visitorData token
   */
  public static async getVisitorData(): Promise<string> {
    const now = Date.now();
    if (this.visitorDataCache && now < this.visitorDataExpiry) {
      return this.visitorDataCache;
    }

    try {
      const res = await this.postJson<{ responseContext?: { visitorData?: string } }>(
        'https://www.youtube.com/youtubei/v1/visitor_id?prettyPrint=false',
        {
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20260805.01.00',
              hl: 'en',
              gl: 'US',
            },
          },
        },
        {
          headers: {
            'X-YouTube-Client-Name': '1',
            'X-YouTube-Client-Version': '2.20260805.01.00',
          },
        }
      );

      const visitorData = res.responseContext?.visitorData;
      if (visitorData) {
        this.visitorDataCache = visitorData;
        this.visitorDataExpiry = now + 1000 * 60 * 60 * 12; // Cache for 12 hours
        return visitorData;
      }
    } catch (err) {
      // Fallback default visitor token if fetch fails
    }

    // Default fallback visitor token
    return 'CgtSQmxzMHAtOXJBUSjLm-vUBjIKCgJJThIEGgAgLw%3D%3D';
  }
}
