import { SchoolUsersPage } from '@/components/SchoolUsersPage';

export const metadata = {
  title: 'Teachers'
};

export default function TeachersPage() {
  return <SchoolUsersPage role="teacher" title="Teachers" />;
}
