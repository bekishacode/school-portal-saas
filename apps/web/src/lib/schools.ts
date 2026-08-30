import { apiFetch } from './api-client';

export interface SchoolBranding {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  brandColor: string | null;
}

// Public, unauthenticated - used by the tenant login page to style
// itself and to resolve the schoolId that gets passed along on login.
export async function getSchoolBySubdomain(subdomain: string): Promise<SchoolBranding> {
  return apiFetch(`/schools/by-subdomain/${encodeURIComponent(subdomain)}`);
}
