// src/pages/Landing.jsx
import { useNavigate } from 'react-router-dom';
import { REQUEST_TYPES, CATEGORIES, COLOR_MAP } from '../lib/requestTypes';

const DIR_TAG = {
  export: { label: 'Export', cls: 'bg-green-100 text-green-800' },
  import: { label: 'Import', cls: 'bg-blue-100 text-blue-800' },
  both:   { label: 'Both',   cls: 'bg-purple-100 text-purple-800' },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Raise a Compliance Request</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a request type below. Your request will be logged, assigned to an SEZ officer,
          and tracked to closure. Attach supporting documents on the next screen.
        </p>
      </div>

      {/* One section per category */}
      {CATEGORIES.map(cat => {
        const types = REQUEST_TYPES.filter(t => t.category === cat.id);
        return (
          <div key={cat.id} className="mb-8">
            {/* Category label */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {cat.label}
              </span>
              <span className="text-xs text-gray-400">{cat.desc}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {types.map(type => {
                const c = COLOR_MAP[type.color];
                const tag = DIR_TAG[type.direction];
                return (
                  <button
                    key={type.id}
                    onClick={() => navigate(`/request/new/${type.id}`)}
                    className={`
                      text-left border rounded-xl p-4 cursor-pointer
                      transition-all duration-150 hover:shadow-sm hover:border-gray-300
                      bg-white border-gray-200 group relative
                    `}
                  >
                    {/* Direction tag */}
                    {tag && (
                      <span className={`absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full ${tag.cls}`}>
                        {tag.label}
                      </span>
                    )}

                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center text-lg mb-3`}>
                      {type.icon}
                    </div>

                    {/* Text */}
                    <div className="text-sm font-medium text-gray-800 leading-snug pr-8">
                      {type.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {type.sub}
                    </div>

                    {/* Arrow on hover */}
                    <div className="mt-3 text-xs text-gray-300 group-hover:text-gray-500 transition-colors flex items-center gap-1">
                      Start request <span>→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
