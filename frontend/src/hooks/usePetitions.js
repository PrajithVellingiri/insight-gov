import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPetitions,
  getPetitionById,
  submitPetition,
  updatePetition,
  semanticSearch,
} from '@/api/petitions.api';

export function usePetitions(params) {
  return useQuery({
    queryKey: ['petitions', params],
    queryFn: () => getPetitions(params),
  });
}

export function usePetition(id) {
  return useQuery({
    queryKey: ['petition', id],
    queryFn: () => getPetitionById(id),
    enabled: !!id,
    refetchInterval: (data) => {
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
