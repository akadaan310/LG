const development = process.env.NODE_ENV === 'development';
const mediaOrigin = (() => { try { const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || ''); return u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(u.hostname)) ? u.origin : ''; } catch { return ''; } })();
const nextConfig = {
  reactStrictMode: true,
  distDir: development ? '.next-dev' : '.next',
  transpilePackages: ['@adequate/domain', '@adequate/ai'],
  poweredByHeader: false,
  experimental: { proxyClientMaxBodySize: '30mb' },
  async headers() {
    return [{source:'/:path*',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Content-Security-Policy',value:`default-src 'self'; script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self' https://*.supabase.co ${mediaOrigin} blob:; connect-src 'self' https://*.supabase.co${development ? ' ws://localhost:* ws://127.0.0.1:*' : ''}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`}
    ]}];
  }
};
export default nextConfig;
