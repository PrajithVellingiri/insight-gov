import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPetitions,
  getPetitionById,
  submitPetition,
  updatePetition,
  semanticSearch,
  getMyPetitions,
} from '@/api/petitions.api';

export function usePetitions(filters = {}) {
  return useQuery({
    queryKey: ['petitions', filters],
    queryFn: () => {
      // If citizen_id is present, we know this is a citizen fetching their own petitions
      if (filters.citizen_id !== undefined) {
        return getMyPetitions(filters);
      }
      return getPetitions(filters);
    },
    refetchInterval: (query) => {
      const data = query.state?.data;
      if (Array.isArray(data) && data.some(p => p.status === 'pending')) return 5000;
      return false;
    },
  });
}

export function usePetition(id) {
  return useQuery({
    queryKey: ['petition', id],
    queryFn: () => getPetitionById(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state?.data;
      // Poll every 5s until analysis is complete
      if (data?.status === 'pending') return 5000;
      return false;
    },
  });
}

export function useSubmitPetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitPetition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['petitions'] }),
  });
}

export function useUpdatePetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updatePetition(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['petition', id] });
      queryClient.invalidateQueries({ queryKey: ['petitions'] });
    },
  });
}

export function useSemanticSearch() {
  return useMutation({
    mutationFn: semanticSearch,
  });
}
