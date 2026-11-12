import { site } from '@/config/site';

interface RuntimeLocals { runtime?: { env?: { ENVIRONMENT?: string } }; }

export function isStaging(locals: unknown): boolean {
  return (locals as RuntimeLocals | undefined)?.runtime?.env?.ENVIRONMENT === 'staging';
}

export function publicSiteBase(requestUrl: URL, locals: unknown): URL {
  return new URL(isStaging(locals) ? requestUrl.origin : site.url);
}
