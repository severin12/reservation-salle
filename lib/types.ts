export const ROLES = ['Admin', 'Responsable', 'Enseignant', 'Personnel'] as const;
export type Role = (typeof ROLES)[number];

export const PUBLIC_ROLES = ['Responsable', 'Enseignant', 'Personnel'] as const;

export const RESERVATION_STATUSES = ['pending', 'confirmed', 'refused', 'cancelled'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  name?: string;
};
