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
  startDate?: string; // ISO date string YYYY-MM-DD
  contractStartDate?: string; // ISO date string YYYY-MM-DD
  contractRenewal?: ContractType;
  senseiNotes?: string;
  address?: string;
  signedContract?: string; // Filename or URL
  password?: string; // For mock auth
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
  date: string; // ISO date string YYYY-MM-DD
  description: string;
}
