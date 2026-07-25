import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePetitions, useSemanticSearch } from '@/hooks/usePetitions';
import PetitionTable from '@/components/petition/PetitionTable';
import { Search, Loader2, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OfficerDashboard() {
  const { user } = useAuth();
  // Fetch petitions assigned to this officer's department
  const { data: petitions = [], isLoading } = usePetitions({ department: user?.department });
  const { mutateAsync: doSearch, isPending: searchLoading } = useSemanticSearch();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const pending = petitions.filter((p) => p.status === 'analysed' || p.status === 'under_review');
  const critical = petitions.filter((p) => p.status !== 'resolved' && (p.priority === 'critical' || p.ai_analysis?.priority === 'critical'));
  const resolved = petitions.filter((p) => p.status === 'resolved');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) { setSearchResults(null); return; }
    try {
      const res = await doSearch({ query, top_k: 5 });
      setSearchResults(res.results || []);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Officer Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{user?.department || 'Department'} Queue</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText size={20} /></div>
          <div><p className="text-2xl font-bold text-slate-900">{pending.length}</p><p className="text-sm text-slate-500">Pending Review</p></div>
        </div>
        <div className="stat-card border border-red-100 bg-red-50/30">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600"><AlertTriangle size={20} /></div>
          <div><p className="text-2xl font-bold text-red-900">{critical.length}</p><p className="text-sm text-red-600 font-medium">Critical Alerts</p></div>
        </div>
        <div className="stat-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600"><CheckCircle size={20} /></div>
          <div><p className="text-2xl font-bold text-slate-900">{resolved.length}</p><p className="text-sm text-slate-500">Resolved (This Month)</p></div>
        </div>
      </div>

      {/* AI Semantic Search */}
      <div id="search" className="card bg-primary-900 text-white shadow-xl shadow-primary-900/10">
        <div className="flex items-start gap-4">
          <div className="mt-1"><Search className="text-primary-300" size={24} /></div>
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-1">AI Semantic Search</h2>
            <p className="text-sm text-primary-200 mb-4">Search across all past petitions using natural language to find precedents or similar cases.</p>
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

            {searchResults !== null && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-primary-200 uppercase tracking-wide">Top Results</h3>
                  <button onClick={() => setSearchResults(null)} className="text-xs text-primary-400 hover:text-white">Clear</button>
                </div>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-primary-300 py-2">No similar petitions found.</p>
                ) : (
                  <div className="grid gap-3">
                    {searchResults.map((res) => (
                      <Link key={res.petition_id} to={`/officer/petitions/${res.petition_id}`} className="block bg-primary-800 rounded-lg p-3 hover:bg-primary-700 transition-colors border border-primary-700">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-white">{res.title}</p>
                          <span className="text-xs font-mono text-primary-300">{Math.round(res.score * 100)}% match</span>
                        </div>
                        <p className="text-xs text-primary-200 line-clamp-2">{res.description}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Department Queue</h2>
        <PetitionTable petitions={petitions} loading={isLoading} role="officer" />
      </div>
    </div>
  );
}
