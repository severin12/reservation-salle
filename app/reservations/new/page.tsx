'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';

const REFRESH_MS = 30000;

function hasConflict(
  reservations: any[],
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const start = toMin(startTime);
  const end = toMin(endTime);

  return reservations.some((item) => {
    if (item.roomId !== roomId) return false;
    if (item.date?.slice(0, 10) !== date) return false;
    if (item.status === 'cancelled' || item.status === 'refused') return false;
    const itemStart = toMin(item.startTime);
    const itemEnd = toMin(item.endTime);
    return start < itemEnd && itemStart < end;
  });
}

export default function NewReservationPage() {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/rooms').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/reservations').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([roomsData, usersData, resData, me]) => {
        const roomsList = Array.isArray(roomsData) ? roomsData : [];
        const usersList = Array.isArray(usersData) ? usersData : [];
        setRooms(roomsList);
        setUsers(usersList);
        setReservations(Array.isArray(resData) ? resData : []);
        setCurrentUser(me);
        if (!roomId && roomsList[0]) setRoomId(roomsList[0].id);
        if (!userId) setUserId(me?.id ?? usersList[0]?.id ?? '');
      })
      .catch(() => {
        setRooms([]);
        setUsers([]);
        setReservations([]);
      });
  }, [roomId, userId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === roomId) ?? rooms[0], [roomId, rooms]);
  const equipmentList =
    typeof selectedRoom?.equipment === 'string'
      ? selectedRoom.equipment.split(',').map((item: string) => item.trim()).filter(Boolean)
      : [];

  const conflict = hasConflict(reservations, roomId, date, startTime, endTime);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roomId || !userId || !reason) {
      showToast('Veuillez remplir tous les champs.', 'warning');
      return;
    }
    if (conflict) {
      showToast('Conflit détecté : la salle est déjà occupée.', 'error');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, userId, date, startTime, endTime, reason, status: 'pending' }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      showToast(data.error ?? 'Erreur lors de la création.', 'error');
      return;
    }

    showToast('Réservation soumise — en attente de confirmation.', 'success');
    setReason('');
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 text-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-4 bg-[linear-gradient(135deg,#1e3a5f,#0f172a)] p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Nouvelle réservation</h1>
          <p className="text-slate-200">Choisissez une salle, définissez l&apos;horaire et vérifiez les conflits.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr,0.9fr]">
          <article className="rounded-4 bg-white p-5 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="form-select" value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} — {room.capacity} places
                  </option>
                ))}
              </select>
              <select className="form-select" value={userId} onChange={(e) => setUserId(e.target.value)} required>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
              <div className="grid gap-4 md:grid-cols-2">
                <input type="time" className="form-control" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <input type="time" className="form-control" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Motif de la réservation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <button className="btn btn-primary w-full" disabled={loading || conflict}>
                {loading ? 'Envoi...' : 'Soumettre la réservation'}
              </button>
            </form>
          </article>

          <aside className="rounded-4 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Détails de la salle</h2>
            <p className="mt-2 text-slate-500">Capacité : {selectedRoom?.capacity ?? 0} places</p>
            <p className="text-slate-500">Équipement : {equipmentList.join(', ') || 'Aucun'}</p>
            <p className="text-slate-500">Bâtiment : {selectedRoom?.building ?? '—'}</p>
            <div
              className={`mt-4 rounded-xl border p-4 text-sm ${
                conflict
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800'
              }`}
            >
              {conflict
                ? '⚠️ Conflit détecté — un email sera envoyé si vous tentez de réserver.'
                : '✅ Aucun conflit sur ce créneau.'}
            </div>
            {currentUser && (
              <p className="mt-4 text-sm text-slate-500">
                Réservation pour : <strong>{currentUser.name}</strong>
              </p>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
