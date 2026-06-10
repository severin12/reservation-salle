'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ToastProvider';
import { formatDateFr, paginate, statusBadgeClass, statusLabel } from '@/lib/utils';
import { ROLES } from '@/lib/types';

const REFRESH_MS = 30000;
type Tab = 'reservations' | 'users' | 'rooms' | 'stats';

export default function AdminPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('reservations');
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'Personnel', department: '' });

  const [roomModal, setRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [roomForm, setRoomForm] = useState({ name: '', capacity: '20', equipment: '', building: '', isAvailable: true });

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/rooms').then((r) => r.json()),
      fetch('/api/reservations').then((r) => r.json()),
    ])
      .then(([usersData, roomsData, reservationsData]) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      })
      .catch(() => {
        setUsers([]);
        setRooms([]);
        setReservations([]);
      });
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredReservations = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.room?.name?.toLowerCase().includes(query.toLowerCase()) ||
          r.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
          r.reason?.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, reservations],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.role.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, users],
  );

  const filteredRooms = useMemo(
    () =>
      rooms.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.building.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, rooms],
  );

  const listData =
    tab === 'reservations' ? filteredReservations : tab === 'users' ? filteredUsers : filteredRooms;
  const { items, totalPages, currentPage, total } = paginate(listData, page);

  const confirmReservation = async (id: string) => {
    const response = await fetch('/api/reservations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? 'Confirmation impossible.', 'error');
      return;
    }
    showToast('Réservation confirmée — email envoyé.', 'success');
    loadData();
  };

  const refuseReservation = async (id: string) => {
    const response = await fetch('/api/reservations/refuse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? 'Refus impossible.', 'error');
      return;
    }
    showToast('Réservation refusée — email envoyé.', 'warning');
    loadData();
  };

  const openUserCreate = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', password: '', role: 'Personnel', department: '' });
    setUserModal(true);
  };

  const openUserEdit = (user: any) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, password: '', role: user.role, department: user.department ?? '' });
    setUserModal(true);
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const method = editingUser ? 'PUT' : 'POST';
    const body = editingUser
      ? { id: editingUser.id, ...userForm, ...(userForm.password ? { password: userForm.password } : {}) }
      : userForm;
    const response = await fetch('/api/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? 'Erreur utilisateur.', 'error');
      return;
    }
    showToast(editingUser ? 'Utilisateur modifié.' : 'Utilisateur créé.', 'success');
    setUserModal(false);
    loadData();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const response = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? 'Suppression impossible.', 'error');
      return;
    }
    showToast('Utilisateur supprimé.', 'success');
    loadData();
  };

  const openRoomCreate = () => {
    setEditingRoom(null);
    setRoomForm({ name: '', capacity: '20', equipment: '', building: '', isAvailable: true });
    setRoomModal(true);
  };

  const openRoomEdit = (room: any) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name,
      capacity: String(room.capacity),
      equipment: room.equipment ?? '',
      building: room.building,
      isAvailable: room.isAvailable,
    });
    setRoomModal(true);
  };

  const saveRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    const method = editingRoom ? 'PUT' : 'POST';
    const response = await fetch('/api/rooms', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        editingRoom
          ? { ...roomForm, id: editingRoom.id, capacity: Number(roomForm.capacity) }
          : { ...roomForm, capacity: Number(roomForm.capacity) },
      ),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? 'Erreur salle.', 'error');
      return;
    }
    showToast(editingRoom ? 'Salle modifiée.' : 'Salle créée.', 'success');
    setRoomModal(false);
    loadData();
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('Supprimer cette salle ?')) return;
    const response = await fetch(`/api/rooms?id=${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? 'Suppression impossible.', 'error');
      return;
    }
    showToast('Salle supprimée.', 'success');
    loadData();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'reservations', label: 'Réservations' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'rooms', label: 'Salles' },
    { id: 'stats', label: 'Statistiques' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 text-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-4 bg-[linear-gradient(135deg,#1e3a5f,#0f172a)] p-6 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-slate-200">Gestion complète des réservations, utilisateurs et salles.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => { setTab(t.id); setPage(1); setQuery(''); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab !== 'stats' && (
          <section className="rounded-4 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                className="form-control md:max-w-md"
                placeholder="Rechercher..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              />
              {tab === 'users' && (
                <button className="btn btn-primary" onClick={openUserCreate}>+ Ajouter un utilisateur</button>
              )}
              {tab === 'rooms' && (
                <button className="btn btn-primary" onClick={openRoomCreate}>+ Ajouter une salle</button>
              )}
            </div>

            {tab === 'reservations' && (
              <div className="overflow-x-auto">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Salle</th>
                      <th>Utilisateur</th>
                      <th>Date</th>
                      <th>Horaire</th>
                      <th>Motif</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item.id}>
                        <td>{item.room?.name}</td>
                        <td>{item.user?.name}</td>
                        <td>{formatDateFr(item.date)}</td>
                        <td>{item.startTime} - {item.endTime}</td>
                        <td>{item.reason}</td>
                        <td>
                          <span className={`badge rounded-pill ${statusBadgeClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </td>
                        <td>
                          {item.status === 'pending' && (
                            <>
                              <button className="btn btn-sm btn-success me-1" onClick={() => confirmReservation(item.id)}>
                                Confirmer
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => refuseReservation(item.id)}>
                                Refuser
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'users' && (
              <div className="overflow-x-auto">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Département</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {items.map((user: any) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span className="badge bg-primary">{user.role}</span></td>
                        <td>{user.department ?? '—'}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openUserEdit(user)}>Modifier</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(user.id)}>Supprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'rooms' && (
              <div className="overflow-x-auto">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr><th>Nom</th><th>Bâtiment</th><th>Capacité</th><th>Disponible</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {items.map((room: any) => (
                      <tr key={room.id}>
                        <td>{room.name}</td>
                        <td>{room.building}</td>
                        <td>{room.capacity}</td>
                        <td>
                          <span className={`badge ${room.isAvailable ? 'bg-success' : 'bg-danger'}`}>
                            {room.isAvailable ? 'Oui' : 'Non'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openRoomEdit(room)}>Modifier</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRoom(room.id)}>Supprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={currentPage} totalPages={totalPages} total={total} onPageChange={setPage} />
          </section>
        )}

        {tab === 'stats' && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total utilisateurs', users.length, 'bg-sky-50'],
              ['Total salles', rooms.length, 'bg-indigo-50'],
              ['Réservations confirmées', reservations.filter((r) => r.status === 'confirmed').length, 'bg-emerald-50'],
              ['Demandes en attente', reservations.filter((r) => r.status === 'pending').length, 'bg-amber-50'],
              ['Réservations refusées', reservations.filter((r) => r.status === 'refused').length, 'bg-rose-50'],
              ['Salles disponibles', rooms.filter((r) => r.isAvailable).length, 'bg-teal-50'],
              ['Total réservations', reservations.length, 'bg-slate-50'],
              ['Admins', users.filter((u) => u.role === 'Admin').length, 'bg-violet-50'],
            ].map(([label, value, tone]) => (
              <article key={label as string} className={`card-hover rounded-4 border border-slate-200 p-5 shadow-sm ${tone}`}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
              </article>
            ))}
          </section>
        )}
      </div>

      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setUserModal(false)}>
          <div className="w-full max-w-lg rounded-4 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-semibold">{editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</h3>
            <form className="space-y-3" onSubmit={saveUser}>
              <input className="form-control" placeholder="Nom" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} required />
              <input className="form-control" type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} required />
              <input className="form-control" type="password" placeholder={editingUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'} value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} {...(editingUser ? {} : { required: true })} />
              <select className="form-select" value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <input className="form-control" placeholder="Département" value={userForm.department} onChange={(e) => setUserForm((p) => ({ ...p, department: e.target.value }))} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setUserModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setRoomModal(false)}>
          <div className="w-full max-w-lg rounded-4 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-semibold">{editingRoom ? 'Modifier la salle' : 'Ajouter une salle'}</h3>
            <form className="space-y-3" onSubmit={saveRoom}>
              <input className="form-control" placeholder="Nom" value={roomForm.name} onChange={(e) => setRoomForm((p) => ({ ...p, name: e.target.value }))} required />
              <input className="form-control" type="number" min="1" placeholder="Capacité" value={roomForm.capacity} onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))} required />
              <input className="form-control" placeholder="Équipement" value={roomForm.equipment} onChange={(e) => setRoomForm((p) => ({ ...p, equipment: e.target.value }))} />
              <input className="form-control" placeholder="Bâtiment" value={roomForm.building} onChange={(e) => setRoomForm((p) => ({ ...p, building: e.target.value }))} required />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={roomForm.isAvailable} onChange={(e) => setRoomForm((p) => ({ ...p, isAvailable: e.target.checked }))} />
                Disponible
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setRoomModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
