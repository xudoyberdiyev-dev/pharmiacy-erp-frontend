import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return null;

  const goTo = (p) => {
    if (p < 1 || p > pages || p === page) return;
    onChange(p);
  };

  const numbers = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) numbers.push(i);

  return (
    <div className="flex items-center justify-between px-2 py-3">
      {total != null && (
        <p className="text-sm text-gray-400">Jami: {total} ta</p>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {numbers.map((n) => (
          <button
            key={n}
            onClick={() => goTo(n)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              n === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= pages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
