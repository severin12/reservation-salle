type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
};

export default function Pagination({ page, totalPages, onPageChange, total }: PaginationProps) {
  return (
    <nav className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {total !== undefined && (
        <span className="text-sm text-slate-500">{total} élément{total > 1 ? 's' : ''}</span>
      )}
      <div className="ms-auto flex gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Précédent
        </button>
        <span className="btn btn-light btn-sm pointer-events-none">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
        </button>
      </div>
    </nav>
  );
}
