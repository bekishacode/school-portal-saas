// Shared types used by both apps/api and apps/web.
// Keep these in sync with the database schema as it's built out.

export type Role =
  | 'super_admin'
  | 'school_admin'
  | 'registrar'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'librarian'
  | 'accountant';

export interface School {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string;
  brandColor?: string;
  subscriptionTier: 'basic' | 'pro' | 'enterprise';
  isActive: boolean;
}

export interface User {
  id: string;
  schoolId: string;
  role: Role;
  fullName: string;
  email: string;
}

export interface Student {
  id: string;
  schoolId: string;
  fullName: string;
  classId: string;
  sectionId: string;
  guardianName?: string;
  guardianContact?: string;
  enrollmentStatus: 'applied' | 'active' | 'graduated' | 'withdrawn';
}

export interface Score {
  id: string;
  schoolId: string;
  studentId: string;
  subjectId: string;
  assessmentId: string;
  value: number;
  maxValue: number;
}
