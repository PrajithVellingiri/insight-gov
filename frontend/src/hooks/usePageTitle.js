import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | InsightGov` : 'InsightGov';
  }, [title]);
}
