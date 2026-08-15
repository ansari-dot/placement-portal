import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function StudentPagination({
  totalItems,
  from,
  to,
  rowsPerPage,
  onRowsPerPageChange,
  currentPage,
  totalPages,
  onPageChange,
}) {
  const pageBtnClass = (isActive) =>
    `w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
      isActive
        ? 'bg-blue-600 text-white font-bold shadow-sm'
        : 'hover:bg-slate-100 font-semibold text-slate-700'
    }`;

  return (
    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
      <span>
        Showing {from} to {to} of {totalItems} student{totalItems !== 1 ? 's' : ''}
      </span>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option>10 per page</option>
            <option>20 per page</option>
            <option>50 per page</option>
          </select>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers with ellipsis logic */}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
              if (i === 6) pageNum = totalPages;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }
            return pageNum;
          }).map((pageNum, idx, arr) => {
            const prevPage = idx > 0 ? arr[idx - 1] : null;
            return (
              <span key={`${pageNum}-${idx}`} className="flex items-center">
                {prevPage && pageNum - prevPage > 1 && (
                  <span className="px-1 text-slate-400">...</span>
                )}
                <button
                  onClick={() => onPageChange(pageNum)}
                  className={pageBtnClass(currentPage === pageNum)}
                >
                  {pageNum}
                </button>
              </span>
            );
          })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}