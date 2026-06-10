'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Pagination from '@/components/Pagination';
import { useToast } from '@/components/ToastProvider';
import { paginate } from '@/lib/utils';

const REFRESH_MS = 30000;

// Images des salles depuis public/images
const ROOM_IMAGES = [
  '/images/S1-gde-salle-int.jpg',
  '/images/St-Remi_centre_communautaire.jpg',
  '/images/Soiree-des-benevoles.jpg',
  '/images/thumbs3__550_300_0_0_crop.jpg',
  '/images/whatsapp-image-2022-03-23-at-16-29-40-6_3_157180-164813078917052.jpeg',
];

function getRoomImage(index: number) {
  return ROOM_IMAGES[index % ROOM_IMAGES.length];
}

export default function RoomsPage() {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', capacity: '20', equipment: '', building: '', isAvailable: true });

  const loadRooms = useCallback(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  useEffect(() => {
    loadRooms();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setIsAdmin(u?.role === 'Admin'));
    const interval = setInterval(loadRooms, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadRooms]);

  const filtered = useMemo(
    () =>
      rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(query.toLowerCase()) ||
          room.building.toLowerCase().includes(query.toLowerCase()) ||
          (room.equipment ?? '').toLowerCase().includes(query.toLowerCase()),
      ),
    [query, rooms],
  );

  const { items, totalPages, currentPage, total } = paginate(filtered, page);

  const openCreate = () => {
    setEditingRoom(null);
    setForm({ name: '', capacity: '20', equipment: '', building: '', isAvailable: true });
    setModalOpen(true);
  };

  const openEdit = (room: any) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      capacity: String(room.capacity),
      equipment: room.equipment ?? '',
      building: room.building,
      isAvailable: room.isAvailable,
    });
    setModalOpen(true);
  };

  const saveRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form, capacity: Number(form.capacity), isAvailable: Boolean(form.isAvailable) };
    const method = editingRoom ? 'PUT' : 'POST';
    const response = await fetch('/api/rooms', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingRoom ? { ...payload, id: editingRoom.id } : payload),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error ?? "Erreur lors de l'enregistrement.", 'error');
      return;
    }
    showToast(editingRoom ? 'Salle modifiée.' : 'Salle créée.', 'success');
    setModalOpen(false);
    loadRooms();
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
    loadRooms();
  };

  return (
    <>
      <style>{`
        .room-card {
          border-radius: 16px;
          overflow: hidden;
          border: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          background: white;
        }
        .room-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(30,58,95,0.15);
        }
        .room-img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        .room-body {
          padding: 20px;
        }
        .room-badge-available {
          background: #d1fae5;
          color: #065f46;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .room-badge-unavailable {
          background: #fee2e2;
          color: #991b1b;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        .equipment-tag {
          background: #f1f5f9;
          color: #475569;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 12px;
        }
        .page-header {
          background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 32px;
          color: white;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .page-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }
        .search-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 24px;
        }
        .btn-navy {
          background: #1e3a5f;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn-navy:hover {
          background: #2d5282;
          color: white;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.6);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(4px);
        }
        .modal-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .modal-card h3 {
          color: #1e3a5f;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .form-control {
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          padding: 10px 14px;
          transition: border-color 0.2s;
        }
        .form-control:focus {
          border-color: #1e3a5f;
          box-shadow: 0 0 0 3px rgba(30,58,95,0.1);
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div className="page-header">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>🚪 Gestion des Salles</h1>
            <p style={{ color: '#cbd5e1', margin: 0 }}>Consultez, ajoutez et gérez toutes les salles disponibles.</p>
          </div>

          {/* Search + Add */}
          <div className="search-section">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <input
                className="form-control"
                style={{ maxWidth: 400, flex: 1 }}
                placeholder="🔍 Rechercher une salle, bâtiment, équipement..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>{total} salle{total > 1 ? 's' : ''}</span>
                {isAdmin && (
                  <button className="btn-navy" onClick={openCreate}>
                    + Ajouter une salle
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Room Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {items.map((room, index) => {
              const equipmentList =
                typeof room.equipment === 'string'
                  ? room.equipment.split(',').map((item: string) => item.trim()).filter(Boolean)
                  : [];
              return (
                <div key={room.id} className="room-card">
                  <img
                    src={getRoomImage(index)}
                    alt={room.name}
                    className="room-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/S1-gde-salle-int.jpg';
                    }}
                  />
                  <div className="room-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e3a5f', margin: 0 }}>{room.name}</h2>
                        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                          🏢 {room.building} &nbsp;•&nbsp; 👥 {room.capacity} places
                        </p>
                      </div>
                      <span className={room.isAvailable ? 'room-badge-available' : 'room-badge-unavailable'}>
                        {room.isAvailable ? '✅ Disponible' : '❌ Indisponible'}
                      </span>
                    </div>

                    {equipmentList.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {equipmentList.map((item: string) => (
                          <span key={item} className="equipment-tag">{item}</span>
                        ))}
                      </div>
                    )}

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                        <button
                          style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #1e3a5f', background: 'white', color: '#1e3a5f', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={() => openEdit(room)}
                          onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1e3a5f'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                          onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.color = '#1e3a5f'; }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #dc2626', background: 'white', color: '#dc2626', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={() => deleteRoom(room.id)}
                          onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#dc2626'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                          onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; (e.currentTarget as HTMLButtonElement).style.color = '#dc2626'; }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!items.length && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚪</div>
              <p style={{ fontSize: 18, fontWeight: 600 }}>Aucune salle trouvée</p>
              <p>Essayez un autre terme de recherche</p>
            </div>
          )}

          <Pagination page={currentPage} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRoom ? '✏️ Modifier la salle' : '➕ Ajouter une salle'}</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={saveRoom}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Nom de la salle *</label>
                <input className="form-control" placeholder="Ex: Salle de conférence A" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Capacité *</label>
                <input className="form-control" type="number" min="1" placeholder="Nombre de places" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Équipements</label>
                <input className="form-control" placeholder="Ex: Projecteur, Wifi, Climatisation" value={form.equipment} onChange={(e) => setForm((p) => ({ ...p, equipment: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Bâtiment *</label>
                <input className="form-control" placeholder="Ex: Bâtiment A" value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} required />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.checked }))} />
                <span>Salle disponible</span>
              </label>
              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button type="button" style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }} onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-navy" style={{ flex: 1 }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
