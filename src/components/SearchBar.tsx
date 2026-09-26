import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div className="relative max-w-2xl mx-auto -mt-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex items-center">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="ابحث عن سيارة (نوع، موديل، مدينة...)"
          className="w-full pr-12 pl-4 py-4 text-lg border-none focus:ring-0 placeholder:text-slate-400 text-slate-800"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
