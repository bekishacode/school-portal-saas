import { SchoolUsersPage } from '@/components/SchoolUsersPage';

export const metadata = {
  title: 'Students'
};

export default function StudentsPage() {
  return <SchoolUsersPage role="student" title="Students" />;
}
