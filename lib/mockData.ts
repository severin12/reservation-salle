export type Room = {
  id: number;
  name: string;
  capacity: number;
  equipment: string[];
  building: string;
  isAvailable: boolean;
};

export type Reservation = {
  id: number;
  room: string;
  user: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: 'confirmed' | 'pending' | 'cancelled';
};

export const rooms: Room[] = [
  { id: 1, name: 'Salle A101', capacity: 40, equipment: ['Projecteur', 'Tableau'], building: 'Bloc A', isAvailable: true },
  { id: 2, name: 'Salle B205', capacity: 25, equipment: ['Vidéo', 'Micro'], building: 'Bloc B', isAvailable: false },
  { id: 3, name: 'Salle C310', capacity: 60, equipment: ['Caméra', 'Wi-Fi'], building: 'Bloc C', isAvailable: true },
  { id: 4, name: 'Salle D102', capacity: 18, equipment: ['Tableau blanc'], building: 'Bloc D', isAvailable: true },
  { id: 5, name: 'Amphi Principal', capacity: 120, equipment: ['Sonorisation', 'Écran'], building: 'Amphi', isAvailable: true },
];

export const reservations: Reservation[] = [
  { id: 1, room: 'Salle A101', user: 'A. Mbaye', date: '2026-06-07', startTime: '09:00', endTime: '10:30', reason: 'Réunion équipe', status: 'confirmed' },
  { id: 2, room: 'Amphi Principal', user: 'M. Diop', date: '2026-06-07', startTime: '11:00', endTime: '12:00', reason: 'Formation', status: 'pending' },
  { id: 3, room: 'Salle B205', user: 'S. Ndao', date: '2026-06-08', startTime: '14:00', endTime: '16:00', reason: 'Atelier', status: 'cancelled' },
  { id: 4, room: 'Salle C310', user: 'I. Sall', date: '2026-06-08', startTime: '10:00', endTime: '11:30', reason: 'Défense de mémoire', status: 'confirmed' },
];

export const weeklyData = [12, 18, 15, 21, 19, 22, 17];
export const roomShare = [40, 25, 20, 15];
