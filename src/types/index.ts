export type Role = 'student' | 'sensei';

export interface Belt {
  id: string;
  name: string;
  color: string; // CSS color value
  order: number; // 0 for White, 1 for Yellow, etc.
}

export type ContractType = 'monthly' | 'quarterly' | 'six_months' | 'yearly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  currentBeltId: string;
  startDate?: Date | null;
  contractStartDate?: Date | null;
  contractRenewal?: ContractType | null;
  senseiNotes?: string | null;
  address?: string | null;
  signedContract?: string | null;
  stripes?: number | null;
  nextTestDate?: Date | null;
  isSwatTeam?: boolean;
  password?: string; // For mock auth
  students?: User[];
  guardians?: User[];
}

export interface Video {
  id: string;
  title: string;
  url: string; // YouTube embed URL
  beltId: string;
}

export interface DojoEvent {
  id: string;
  title: string;
  date: Date | null;
  description: string;
}
