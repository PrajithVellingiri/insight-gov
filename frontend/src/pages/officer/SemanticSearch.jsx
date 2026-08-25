import { useState } from 'react';
import { useSemanticSearch } from '@/hooks/usePetitions';
import { Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import MicButton from '@/components/ui/MicButton';
import { useTranslation } from 'react-i18next';


export default function SemanticSearch() {
  const { i18n } = useTranslation();
  usePageTitle('Semantic Search');
  const { mutateAsync: doSearch, isPending: searchLoading } = useSemanticSearch();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) { 
      setSearchResults(null); 
      setSearchError(null);
      return; 
    }
    
    setSearchError(null);
    setSearchResults(null);
    
    try {
      const res = await doSearch({ query, top_k: 10 });
      setSearchResults(res.results || []);
    } catch (err) {
      console.error('Search failed', err);
      setSearchError(err?.response?.data?.detail || 'An unexpected error occurred during search.');
    }
  };

  const clearResults = () => {
    setSearchResults(null);
    setSearchError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Semantic Search</h1>
          <p className="text-muted-foreground text-sm mt-1">Search across all past petitions using natural language to find precedents or similar cases.</p>
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
              <MicButton 
                onTranscript={(text) => setQuery(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text)} 
                language={i18n.language}
                className="bg-primary-800 hover:bg-primary-700 text-primary-200" 
              />
              <button type="submit" disabled={searchLoading} className="btn bg-card text-primary-900 hover:bg-primary-50 font-semibold px-6">
                {searchLoading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {searchError && (
        <div className="card bg-destructive/10 border border-destructive/20 text-center py-10">
          <p className="text-destructive font-semibold mb-1">Search Service Unavailable</p>
          <p className="text-destructive/80 text-sm">{searchError}</p>
        </div>
      )}

      {searchResults !== null && !searchError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Search Results</h2>
            <button onClick={clearResults} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Clear Results</button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-muted-foreground">No similar petitions found matching your query.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {searchResults.map((res) => (
                <Link key={res.petition_id} to={`/officer/petitions/${res.petition_id}`} className="card hover:shadow-md transition-shadow cursor-pointer block border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground text-lg">{res.title}</h3>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-primary-50 text-primary-700 border border-primary-100">
                      {Math.round(res.score * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{res.description}</p>
                  {res.status && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-muted text-muted-foreground border-border">
                        {res.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
