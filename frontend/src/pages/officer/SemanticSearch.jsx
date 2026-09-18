import { useState } from 'react';
import { useSemanticSearch } from '@/hooks/usePetitions';
import { Search, Loader2, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import MicButton from '@/components/ui/MicButton';
import Card3D from '@/components/ui/Card3D';
import { useTranslation } from 'react-i18next';

export default function SemanticSearch() {
  const { i18n } = useTranslation();
  usePageTitle('Semantic Vector Search');
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
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Sparkles size={13} />
            High-Dimensional Vector Engine
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          AI Semantic Search
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Query the historical petition vector embedding database in natural language to identify precedents, repeat patterns, or related community reports.
        </p>
      </div>

      {/* Futuristic Search Console */}
      <div className="glass-panel-elevated rounded-3xl p-6 border border-blue-500/30 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-blue-500/15 blur-2xl" aria-hidden="true" />
        
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 'repeated drainage overflow during heavy monsoon' or 'frequent transformer failures'"
                className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center gap-2">
              <MicButton 
                onTranscript={(text) => setQuery(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text)} 
                language={i18n.language}
                className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700/80 rounded-xl px-3 py-3" 
              />
              <button
                type="submit"
                disabled={searchLoading || !query.trim()}
                className="btn-primary py-3 px-6 text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50"
              >
                {searchLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Query Vectors</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {searchError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center animate-fade-in">
          <p className="text-rose-400 font-bold text-sm mb-1">Vector Search Service Unavailable</p>
          <p className="text-muted-foreground text-xs">{searchError}</p>
        </div>
      )}

      {searchResults !== null && !searchError && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers size={17} className="text-blue-400" />
              Vector Precedent Matches ({searchResults.length})
            </h2>
            <button
              onClick={clearResults}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Clear Results
            </button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="card text-center py-14 text-muted-foreground text-sm">
              No matching petitions identified with sufficient cosine similarity.
            </div>
          ) : (
            <div className="grid gap-3.5">
              {searchResults.map((res) => {
                const matchPct = Math.round(res.score * 100);
                return (
                  <Link
                    key={res.petition_id}
                    to={`/officer/petitions/${res.petition_id}`}
                    className="block no-underline group"
                  >
                    <Card3D className="p-5 hover:border-blue-500/40">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-bold text-foreground text-base group-hover:text-blue-400 transition-colors">
                          {res.title}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex-shrink-0">
                          {matchPct}% Cosine Match
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                        {res.description}
                      </p>
                      {res.status && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Status:</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-700/60 bg-slate-800/60 text-slate-300">
                            {res.status.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </Card3D>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
