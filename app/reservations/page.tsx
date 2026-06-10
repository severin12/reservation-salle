'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Parser } from 'json2csv';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ToastProvider';
import { formatDateFr, paginate, statusBadgeClass, statusLabel } from '@/lib/utils';

const REFRESH_MS = 30000;

export default function ReservationsPage() {
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Tous');
  const [room, setRoom] = useState('Tous');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any | null>(null);
  const [form, setForm] = useState({
    roomId: '',
    userId: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:30',
    reason: '',
    status: 'pending',
  });

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/reservations').then((r) => r.json()),
      fetch('/api/rooms').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([resData, roomsData, usersData, me]) => {
        setReservations(Array.isArray(resData) ? resData : []);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setCurrentUser(me);
      })
      .catch(() => {
        setReservations([]);
        setRooms([]);
        setUsers([]);
      });
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  const filtered = useMemo(
    () =>
      reservations.filter(
        (item) =>
          (status === 'Tous' ? true : item.status === status) &&
          (room === 'Tous' ? true : item.room?.name === room) &&
          (item.reason.toLowerCase().includes(query.toLowerCase()) ||
            item.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
            item.room?.name?.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, status, room, reservations],
  );

  const { items, totalPages, currentPage, total } = paginate(filtered, page);

  const exportRows = filtered.map((item) => ({
    Salle: item.room?.name ?? '',
    Utilisateur: item.user?.name ?? '',
    Date: formatDateFr(item.date),
    Début: item.startTime,
    Fin: item.endTime,
    Motif: item.reason,
    Statut: statusLabel(item.status),
  }));

  const exportCsv = () => {
    const parser = new Parser({ fields: ['Salle', 'Utilisateur', 'Date', 'Début', 'Fin', 'Motif', 'Statut'] });
    const csv = parser.parse(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Export CSV généré.', 'success');
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Système de Réservation de Salles', 14, 12);
    doc.setFontSize(10);
    doc.text(`Export généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 20);
    doc.setTextColor(30, 58, 95);
    autoTable(doc, {
      startY: 36,
      head: [['Salle', 'Utilisateur', 'Date', 'Début', 'Fin', 'Motif', 'Statut']],
      body: exportRows.map((row) => [row.Salle, row.Utilisateur, row.Date, row.Début, row.Fin, row.Motif, row.Statut]),
      headStyles: { fillColor: [30, 58, 95] },
      styles: { fontSize: 9 },
    });
    doc.save(`reservations-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Export PDF généré.', 'success');
  };

  const openCreate = () => {
    setEditingReservation(null);
    setForm({
      roomId: rooms[0]?.id ?? '',
      userId: currentUser?.id ?? users[0]?.id ?? '',
      date: new Date().toISOString().slice(0, 10),
      startTime: '09:00',
      endTime: '10:30',
      reason: '',
      status: 'pending',
    });
    setModalOpen(true);
  };

  const openEdit = (reservation: any) => {
    setEditingReservation(reservation);
    setForm({
      roomId: reservation.roomId,
      userId: reservation.userId,
      date: reservation.date.slice(0, 10),
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      reason: reservation.reason,
      status: reservation.status,
    });
    setModalOpen(true);
  };

  const saveReservation = async (event: React.FormEvent) => {
    event.preventDefault();
    const method = editingReservation ? 'PUT' : 'POST';
    const response = await fetch('/api/reservations', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingReservation ? { ...form, id: editingReservation.id } : form),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? 'Erreur lors de l\'enregistrement.', 'error');
      return;
    }
    showToast(editingReservation ? 'Réservation modifiée.' : 'Réservation créée.', 'success');
    setModalOpen(false);
    loadData();
  };

  const cancelReservation = async (reservation: any) => {
    const response = await fetch('/api/reservations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...reservation, id: reservation.id, date: reservation.date, status: 'cancelled' }),
    });
    if (!response.ok) {
      const data = await response.json();
      showToast(data.error ?? 'Annulation impossible.', 'error');
      return;
    }
    showToast('Réservation annulée.', 'warning');
    loadData();
  };

  const deleteReservation = async (id: string) => {
    if (!confirm('Supprimer cette réservation ?')) return;
    const response = await fetch(`/api/reservations?id=${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? 'Suppression impossible.', 'error');
      return;
    }
    showToast('Réservation supprimée.', 'success');
    loadData();
  };

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 text-slate-800 print-area">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="no-print rounded-4 bg-[linear-gradient(135deg,#1e3a5f,#0f172a)] p-6 text-white shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Réservations</h1>
              <p className="text-slate-200">Recherche, export, impression et suivi des réservations.</p>
            </div>
            <button className="btn btn-light" onClick={openCreate}>
              + Nouvelle réservation
            </button>
          </div>
        </header>

        <section className="rounded-4 bg-white p-5 shadow-sm">
          <div className="no-print mb-4 flex flex-wrap gap-3">
            <input
              className="form-control md:max-w-sm"
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
            <select className="form-select w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option>Tous</option>
              <option value="confirmed">Confirmée</option>
              <option value="pending">En attente</option>
              <option value="refused">Refusée</option>
              <option value="cancelled">Annulée</option>
            </select>
            <select className="form-select w-auto" value={room} onChange={(e) => { setRoom(e.target.value); setPage(1); }}>
              <option>Tous</option>
              {rooms.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
            <button className="btn btn-outline-primary" onClick={exportCsv}>
              Exporter CSV
            </button>
            <button className="btn btn-outline-danger" onClick={exportPdf}>
              Exporter PDF
            </button>
            <button className="btn btn-outline-secondary" onClick={() => window.print()}>
              Imprimer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Salle</th>
                  <th>Utilisateur</th>
                  <th>Date</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.room?.name ?? item.roomId}</td>
                    <td>{item.user?.name ?? item.userId}</td>
                    <td>{formatDateFr(item.date)}</td>
                    <td>{item.startTime}</td>
                    <td>{item.endTime}</td>
                    <td>{item.reason}</td>
                    <td>
                      <span className={`badge rounded-pill ${statusBadgeClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="no-print">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(item)}>
                        Modifier
                      </button>
                      {item.status !== 'cancelled' && item.status !== 'refused' && (
                        <button className="btn btn-sm btn-outline-warning me-1" onClick={() => cancelReservation(item)}>
                          Annuler
                        </button>
                      )}
                      {(isAdmin || item.userId === currentUser?.id) && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteReservation(item.id)}>
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-slate-500">
                      Aucune réservation trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="no-print">
            <Pagination page={currentPage} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        </section>

        {modalOpen && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setModalOpen(false)}>
            <div className="w-full max-w-2xl rounded-4 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-4 text-xl font-semibold">
                {editingReservation ? 'Modifier la réservation' : 'Ajouter une réservation'}
              </h3>
              <form className="space-y-3" onSubmit={saveReservation}>
                <select className="form-select" value={form.roomId} onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value }))} required>
                  <option value="">Choisir une salle</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <select className="form-select" value={form.userId} onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))} required>
                  <option value="">Choisir un utilisateur</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
                <input type="date" className="form-control" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
                <div className="grid gap-3 md:grid-cols-2">
                  <input type="time" className="form-control" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} required />
                  <input type="time" className="form-control" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} required />
                </div>
                <textarea className="form-control" rows={3} placeholder="Motif" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} required />
                {isAdmin && editingReservation && (
                  <select className="form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="refused">Refusée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
