import { useState } from 'react';
import { useSemanticSearch } from '@/hooks/usePetitions';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import MicButton from '@/components/ui/MicButton';
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
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#78917F] block mb-1">
          01 / KNOWLEDGE DISCOVERY
        </span>
        <h1 className="text-3xl font-extrabold text-[#202522] tracking-tight">
          Semantic Case Search
        </h1>
        <p className="text-sm text-[#68716B] mt-1 max-w-xl leading-relaxed">
          Search the historical petition archive using natural language to discover related grievances, precedents, and jurisdictional trends.
        </p>
      </div>

      {/* Search Console */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5DE] shadow-card">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68716B]" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 'repeated drainage overflow during monsoon' or 'transformer failures'"
                className="w-full rounded-xl bg-white border border-[#E5E5DE] pl-10 pr-4 py-2.5 text-sm text-[#202522] placeholder:text-[#9EA5A0] focus:border-[#315C4A] focus:ring-1 focus:ring-[#315C4A] transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <MicButton 
                onTranscript={(text) => setQuery(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text)} 
                language={i18n.language}
                className="bg-[#EFF4F0] text-[#315C4A] border border-[#D4E2D8] rounded-xl px-3 py-2.5 hover:bg-[#E2ECE6]" 
              />
              <button
                type="submit"
                disabled={searchLoading || !query.trim()}
                className="btn-primary py-2.5 px-6 text-sm disabled:opacity-50"
              >
                {searchLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Search Archive</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[#68716B]">
            Searches vector embeddings across petition descriptions, categories, and resolution notes.
          </p>
        </form>
      </div>

      {/* Error state */}
      {searchError && (
        <div className="rounded-2xl border border-[#FBD5D5] bg-[#FDF2F2] p-4 text-xs text-[#B91C1C]">
          {searchError}
        </div>
      )}

      {/* Results */}
      {searchResults !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#202522]">
              Matches Found ({searchResults.length})
            </h2>
            <button
              onClick={clearResults}
              className="text-xs text-[#315C4A] hover:underline font-medium"
            >
              Clear Results
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E5DE] p-10 text-center text-[#68716B] text-xs">
              No semantic matches found for this query.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#E5E5DE] p-5 shadow-card hover:border-[#D4D4CA] transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-mono text-xs font-semibold text-[#68716B]">
                      #{item.petition_id || item.id || idx + 1}
                    </span>
                    {item.similarity !== undefined && (
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#EFF4F0] text-[#315C4A] border border-[#D4E2D8]">
                        {Math.round(item.similarity * 100)}% Match
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#202522] mb-1">
                    {item.title || item.petition_title || 'Untitled Record'}
                  </h3>

                  <p className="text-xs text-[#68716B] leading-relaxed line-clamp-2 mb-3">
                    {item.description || item.petition_description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E5DE] text-[11px] text-[#68716B]">
                    <span>{item.department_name || item.department || 'General'}</span>
                    <Link
                      to={`/officer/petitions/${item.petition_id || item.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#315C4A] hover:underline"
                    >
                      <span>Inspect Case File</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
