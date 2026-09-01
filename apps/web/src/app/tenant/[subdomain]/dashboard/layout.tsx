import type { Metadata } from 'next';
import { getSchoolBySubdomain } from '@/lib/schools';

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string };
}): Promise<Metadata> {
  try {
    const school = await getSchoolBySubdomain(params.subdomain);
    return { title: `Dashboard · ${school.name}` };
  } catch {
    return { title: 'Dashboard' };
  }
}

export default function TenantDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
