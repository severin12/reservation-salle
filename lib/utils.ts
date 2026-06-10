export function formatDateFr(value: string | Date): string {
  const date = new Date(value);
  return date.toLocaleDateString('fr-FR');
}

export function formatDateIso(value: string | Date): string {
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

export const ITEMS_PER_PAGE = 10;

export function paginate<T>(items: T[], page: number, perPage = ITEMS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    totalPages,
    currentPage,
    total: items.length,
  };
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-success';
    case 'pending':
      return 'bg-warning text-dark';
    case 'refused':
      return 'bg-danger';
    case 'cancelled':
      return 'bg-secondary';
    default:
      return 'bg-secondary';
  }
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    confirmed: 'Confirmée',
    pending: 'En attente',
    refused: 'Refusée',
    cancelled: 'Annulée',
  };
  return labels[status] ?? status;
}
