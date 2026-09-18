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
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#DDDCD7] pb-6">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F05A3C] block mb-2">
          KNOWLEDGE RETRIEVAL
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#181817] uppercase tracking-tight">
          Semantic Search
        </h1>
        <p className="text-xs font-mono text-[#6F6F6A] mt-1 uppercase">
          Query the historical petition archive using natural language embeddings
        </p>
      </div>

      {/* Search Console */}
      <div className="bg-white rounded-md p-6 border border-[#DDDCD7] shadow-card">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6F6F6A]" size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 'drainage overflow during monsoon' or 'transformer issues'"
                className="w-full rounded-md bg-white border border-[#DDDCD7] pl-10 pr-4 py-2.5 text-xs text-[#181817] placeholder:text-[#6F6F6A] focus:border-[#F05A3C] focus:ring-1 focus:ring-[#F05A3C] transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <MicButton 
                onTranscript={(text) => setQuery(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text)} 
                language={i18n.language}
                className="bg-[#F7F6F2] text-[#181817] border border-[#DDDCD7] rounded-md px-3 py-2.5 hover:border-[#181817]" 
              />
              <button
                type="submit"
                disabled={searchLoading || !query.trim()}
                className="btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {searchLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Query Archive</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[11px] font-mono text-[#6F6F6A]">
            Vector cosine similarity across descriptions, department codes, and resolution logs.
          </p>
        </form>
      </div>

      {/* Error state */}
      {searchError && (
        <div className="rounded-md border border-[#E13B22]/30 bg-[#FFF0EB] p-4 text-xs text-[#E13B22] font-mono">
          {searchError}
        </div>
      )}

      {/* Results */}
      {searchResults !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#DDDCD7]">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#181817]">
              VECTOR MATCHES FOUND ({searchResults.length})
            </h2>
            <button
              onClick={clearResults}
              className="text-xs font-mono uppercase text-[#181817] hover:text-[#F05A3C] font-semibold"
            >
              Clear Results
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white rounded-md border border-[#DDDCD7] p-10 text-center text-[#6F6F6A] text-xs font-mono">
              NO SEMANTIC MATCHES IDENTIFIED.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-md border border-[#DDDCD7] p-5 shadow-card hover:border-[#181817] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-mono text-xs font-bold text-[#181817]">
                      #{item.petition_id || item.id || idx + 1}
                    </span>
                    {item.similarity !== undefined && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFF0EB] text-[#F05A3C] border border-[#F05A3C]/30">
                        {Math.round(item.similarity * 100)}% Match
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#181817] mb-1">
                    {item.title || item.petition_title || 'Untitled Record'}
                  </h3>

                  <p className="text-xs text-[#6F6F6A] leading-relaxed line-clamp-2 mb-3">
                    {item.description || item.petition_description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[#DDDCD7] text-[11px] font-mono text-[#6F6F6A]">
                    <span>{item.department_name || item.department || 'General'}</span>
                    <Link
                      to={`/officer/petitions/${item.petition_id || item.id}`}
                      className="inline-flex items-center gap-1 font-bold uppercase text-[#181817] hover:text-[#F05A3C] transition-colors"
                    >
                      <span>Review Docket</span>
                      <ArrowRight size={11} />
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
