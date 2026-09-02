import type { Metadata } from 'next';
import { getSchoolBySubdomain } from '@/lib/schools';
import { TenantDashboardFrame } from '@/components/TenantDashboardFrame';

export async function generateMetadata({
  params,
}: {
  params: { subdomain: string };
}): Promise<Metadata> {
  try {
    const school = await getSchoolBySubdomain(params.subdomain);
    return { 
      title: {
        default: `Home | ${school.name}`,
        template: `%s | ${school.name} | Scholaas`
      }
    };
  } catch {
    return { 
      title: {
        default: 'Home',
        template: '%s | Scholaas'
      }
    };
  }
}

export default function TenantDashboardLayout({ children }: { children: React.ReactNode }) {
  return <TenantDashboardFrame>{children}</TenantDashboardFrame>;
}