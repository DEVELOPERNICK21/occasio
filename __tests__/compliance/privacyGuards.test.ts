import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');
const SKIP_DIRS = new Set(['node_modules', '.next', 'Pods', 'build', '.git', 'vendor', '__tests__']);
const TEXT_EXT = /\.(ts|tsx|js|jsx|css|html|svg|json|md|kt|java|swift|m|plist|xml|gradle|properties)$/;

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TEXT_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (f: string) => path.relative(ROOT, f);
const read = (f: string) => fs.readFileSync(f, 'utf8');

const SHIPPED = [
  ...walk(path.join(ROOT, 'src')),
  ...walk(path.join(ROOT, 'docs-site/src')),
  ...walk(path.join(ROOT, 'docs-site/public')),
  ...walk(path.join(ROOT, 'functions/src')),
  ...walk(path.join(ROOT, 'android/app/src')),
  ...walk(path.join(ROOT, 'ios/Occasio')),
  ...walk(path.join(ROOT, 'ios/OccasioWidgets')),
];

describe('no third-party origins are loaded by the app or the website', () => {
  // Hosts that leak the visitor's IP address to a third party just by being loaded.
  const THIRD_PARTY = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'use.typekit.net',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'cdnjs.cloudflare.com',
    'googletagmanager.com',
    'google-analytics.com',
    'images.unsplash.com',
    'connect.facebook.net',
    'static.hotjar.com',
    'clarity.ms',
  ];

  it.each(THIRD_PARTY)('%s is not referenced', (host) => {
    const hits = SHIPPED.filter((f) => read(f).includes(host)).map(rel);
    expect(hits).toEqual([]);
  });

  it('serves fonts through next/font (self-hosted at build), never a <link>', () => {
    const layout = read(path.join(ROOT, 'docs-site/src/app/layout.tsx'));
    expect(layout).toMatch(/from ["']next\/font\/(google|local)["']/);
    expect(layout).not.toMatch(/<link[^>]+rel=["']stylesheet["'][^>]+font/i);
  });
});

describe('no analytics, replay or tracking packages without a conscious decision', () => {
  // If this fails you added one. Register it with `registerAnalyticsSink` so it only
  // runs after opt-in (src/shared/analytics/consent.ts), keep session replay off, mask
  // every input, then update this list and the privacy policy (§3.2, §6).
  const BANNED = /posthog|hotjar|fullstory|logrocket|clarity|mixpanel|amplitude|segment|heap|smartlook|appsflyer|adjust|branch|sentry|bugsnag|datadog|crashlytics|firebase\/analytics|google-analytics|gtag|@vercel\/analytics|plausible|facebook-sdk|react-native-fbsdk/i;

  it.each(['package.json', 'docs-site/package.json', 'functions/package.json'])('%s', (file) => {
    const pkg = JSON.parse(read(path.join(ROOT, file))) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(names.filter((n) => BANNED.test(n))).toEqual([]);
  });

  it('does not enable Firebase analytics or ad identifiers on iOS', () => {
    const plist = read(path.join(ROOT, 'ios/Occasio/GoogleService-Info.plist'));
    expect(plist).toMatch(/<key>IS_ANALYTICS_ENABLED<\/key>\s*<false\/>/);
    expect(plist).toMatch(/<key>IS_ADS_ENABLED<\/key>\s*<false\/>/);
  });
});

describe('no secrets in shipped source', () => {
  // Public by design and therefore allowed: Firebase client config and RevenueCat SDK keys.
  const ALLOWED_FILES = ['google-services.json', 'GoogleService-Info.plist', 'revenueCat.ts'];
  const SECRET = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /"private_key"\s*:/,
    /\bsk_(?:live|test)_[A-Za-z0-9]{16,}/,
    /\bre_[A-Za-z0-9]{24,}\b/,
    /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
    /\bgh[pousr]_[A-Za-z0-9]{30,}/,
    /\bAKIA[0-9A-Z]{16}\b/,
  ];

  it('contains no private keys or API secrets', () => {
    const hits: string[] = [];
    for (const f of SHIPPED) {
      if (ALLOWED_FILES.some((a) => f.endsWith(a))) continue;
      const text = read(f);
      for (const pattern of SECRET) {
        if (pattern.test(text)) hits.push(`${rel(f)} matches ${pattern}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('keeps server-only environment variables out of client code', () => {
    const serverOnly = /process\.env\.(FIREBASE_SERVICE_ACCOUNT_JSON|AGE_ATTESTATION_SECRET|EMAIL_UNSUBSCRIBE_SECRET|RESEND_API_KEY|REVENUECAT_SECRET_KEY|OCCASIO_RC_WEBHOOK_AUTH|OCCASIO_CRON_SECRET)/;
    const clientFiles = [...walk(path.join(ROOT, 'src')), ...SHIPPED.filter((f) => /docs-site\/src\/components\//.test(f))];
    expect(clientFiles.filter((f) => serverOnly.test(read(f))).map(rel)).toEqual([]);
  });

  it('exposes no NEXT_PUBLIC_ variable that looks secret', () => {
    const hits = SHIPPED.filter((f) => /NEXT_PUBLIC_\w*(SECRET|KEY|TOKEN|PASSWORD|SERVICE_ACCOUNT)/i.test(read(f))).map(rel);
    expect(hits).toEqual([]);
  });

  it('release builds do not contain the RevenueCat Test Store key', () => {
    const cfg = read(path.join(ROOT, 'src/shared/config/revenueCat.ts'));
    expect(cfg).toMatch(/testApiKey:\s*__DEV__\s*\?/);
  });
});
