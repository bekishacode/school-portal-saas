import { SchoolUsersPage } from '@/components/SchoolUsersPage';

export const metadata = {
  title: 'Registrars'
};

export default function RegistrarsPage() {
  return <SchoolUsersPage role="registrar" title="Registrars" />;
}
