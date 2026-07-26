import { useState } from 'react';
import { useSemanticSearch } from '@/hooks/usePetitions';
import { Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SemanticSearch() {
  const { mutateAsync: doSearch, isPending: searchLoading } = useSemanticSearch();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) { setSearchResults(null); return; }
    try {
      const res = await doSearch({ query, top_k: 10 });
      setSearchResults(res.results || []);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Semantic Search</h1>
          <p className="text-slate-500 text-sm mt-1">Search across all past petitions using natural language to find precedents or similar cases.</p>
        </div>
      </div>

      <div className="card bg-primary-900 text-white shadow-xl shadow-primary-900/10">
        <div className="flex items-start gap-4">
          <div className="mt-1"><Search className="text-primary-300" size={24} /></div>
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 'waterlogging near schools' or 'repeated streetlight failures'"
                className="flex-1 rounded-lg bg-primary-800 border border-primary-700 px-4 py-2.5 text-sm text-white placeholder:text-primary-400 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
              />
              <button type="submit" disabled={searchLoading} className="btn bg-white text-primary-900 hover:bg-primary-50 font-semibold px-6">
                {searchLoading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {searchResults !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Search Results</h2>
            <button onClick={() => setSearchResults(null)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Clear Results</button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-500">No similar petitions found matching your query.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {searchResults.map((res) => (
                <Link key={res.petition_id} to={`/officer/petitions/${res.petition_id}`} className="card hover:shadow-md transition-shadow cursor-pointer block border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900 text-lg">{res.title}</h3>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-primary-50 text-primary-700 border border-primary-100">
                      {Math.round(res.score * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{res.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
