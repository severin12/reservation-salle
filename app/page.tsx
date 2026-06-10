'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Pagination from '@/components/Pagination';
import { getStartOfWeek, getWeekDayLabels, isSameDay } from '@/lib/reservations';
import { formatDateFr, paginate, statusBadgeClass, statusLabel } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

type Room = { id: string; name: string; reservations?: { id: string }[] };
type User = { id: string; name: string };
type Reservation = {
  id: string;
  roomId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
  room?: { name: string };
  user?: { name: string };
};

const REFRESH_MS = 30000;

function KpiCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <article className={`card-hover rounded-4 border border-slate-200 bg-white p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md ${color}`}>{icon}</div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [roomFilter, setRoomFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [userFilter, setUserFilter] = useState('Tous');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/rooms').then((r) => r.json()),
      fetch('/api/reservations').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([roomsData, reservationsData, usersData, me]) => {
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setCurrentUser(me);
      })
      .catch(() => {
        setRooms([]);
        setReservations([]);
        setUsers([]);
      });
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  const today = new Date();
  const todayReservations = reservations.filter((r) => isSameDay(r.date, today));
  const pendingCount = reservations.filter((r) => r.status === 'pending').length;

  const occupationRate = useMemo(() => {
    if (!rooms.length) return '0%';
    const todayConfirmed = todayReservations.filter((r) => r.status === 'confirmed').length;
    const rate = Math.round((todayConfirmed / rooms.length) * 100);
    return `${Math.min(rate, 100)}%`;
  }, [rooms.length, todayReservations]);

  const weeklyData = useMemo(() => {
    const start = getStartOfWeek();
    const labels = getWeekDayLabels();
    const counts = labels.map((_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return reservations.filter((r) => isSameDay(r.date, day) && r.status !== 'cancelled' && r.status !== 'refused').length;
    });
    return { labels, counts };
  }, [reservations]);

  const roomPieData = useMemo(() => {
    const counts = rooms.map((room) =>
      reservations.filter((r) => r.roomId === room.id && r.status !== 'cancelled' && r.status !== 'refused').length,
    );
    return { labels: rooms.map((r) => r.name), counts };
  }, [rooms, reservations]);

  const filtered = useMemo(
    () =>
      reservations.filter((item) => {
        if (roomFilter !== 'Tous' && item.room?.name !== roomFilter) return false;
        if (statusFilter !== 'Tous' && item.status !== statusFilter) return false;
        if (userFilter !== 'Tous' && item.user?.name !== userFilter) return false;
        if (dateFilter && !isSameDay(item.date, dateFilter)) return false;
        return true;
      }),
    [roomFilter, statusFilter, userFilter, dateFilter, reservations],
  );

  const { items: pagedItems, totalPages, currentPage, total } = paginate(filtered, page);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 text-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-4 bg-[linear-gradient(135deg,#1e3a5f,#0f172a)] p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-sky-100">Tableau de bord</p>
              <h1 className="mt-2 text-3xl font-bold">Système de réservation de salles</h1>
              <p className="mt-2 text-slate-200">Vue d&apos;ensemble, réservations du jour et gestion rapide.</p>
            </div>
            {currentUser && (
              <div className="rounded-3 bg-white/10 p-4 text-sm">
                Connecté en tant que <strong>{currentUser.name}</strong> ({currentUser.role})
              </div>
            )}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Salles"
            value={rooms.length}
            color="bg-sky-100 text-sky-700"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14" />
              </svg>
            }
          />
          <KpiCard
            label="Réservations du jour"
            value={todayReservations.length}
            color="bg-indigo-100 text-indigo-700"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <KpiCard
            label="Demandes en attente"
            value={pendingCount}
            color="bg-amber-100 text-amber-700"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KpiCard
            label="Taux d'occupation"
            value={occupationRate}
            color="bg-emerald-100 text-emerald-700"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <article className="rounded-4 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Réservations de la semaine</h2>
            <Bar
              data={{
                labels: weeklyData.labels,
                datasets: [{ label: 'Réservations', data: weeklyData.counts, backgroundColor: '#1e3a5f', borderRadius: 6 }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </article>
          <article className="rounded-4 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Répartition par salle</h2>
            <Pie
              data={{
                labels: roomPieData.labels.length ? roomPieData.labels : ['Aucune'],
                datasets: [{
                  data: roomPieData.counts.length ? roomPieData.counts : [1],
                  backgroundColor: ['#1e3a5f', '#2563eb', '#38bdf8', '#60a5fa', '#93c5fd', '#a7f3d0'],
                }],
              }}
              options={{ responsive: true }}
            />
          </article>
        </section>

        <section className="rounded-4 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Réservations récentes</h2>
              <p className="text-sm text-slate-500">Actualisation automatique toutes les 30 secondes.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                type="date"
                className="form-control w-auto"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              />
              <select className="form-select w-auto" value={roomFilter} onChange={(e) => { setRoomFilter(e.target.value); setPage(1); }}>
                <option>Tous</option>
                {rooms.map((room) => (
                  <option key={room.id}>{room.name}</option>
                ))}
              </select>
              <select className="form-select w-auto" value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}>
                <option>Tous</option>
                {users.map((user) => (
                  <option key={user.id}>{user.name}</option>
                ))}
              </select>
              <select className="form-select w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option>Tous</option>
                <option value="confirmed">Confirmée</option>
                <option value="pending">En attente</option>
                <option value="refused">Refusée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-hover align-middle">
              <thead>
                <tr className="text-slate-500">
                  <th>Salle</th>
                  <th>Utilisateur</th>
                  <th>Date</th>
                  <th>Horaire</th>
                  <th>Motif</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.room?.name ?? item.roomId}</td>
                    <td>{item.user?.name ?? item.userId}</td>
                    <td>{formatDateFr(item.date)}</td>
                    <td>
                      {item.startTime} - {item.endTime}
                    </td>
                    <td>{item.reason}</td>
                    <td>
                      <span className={`badge rounded-pill ${statusBadgeClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {!pagedItems.length && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 py-4">
                      Aucune réservation trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={currentPage} totalPages={totalPages} total={total} onPageChange={setPage} />
        </section>
      </div>
    </div>
  );
}
