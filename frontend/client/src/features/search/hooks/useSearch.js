import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';

export const useSearch = (searchTerm) => {
  return useQuery({
    queryKey: ['search', searchTerm],
    queryFn: () => searchApi(searchTerm),
    enabled: !!searchTerm && searchTerm.trim().length >= 1,
    staleTime: 1000 * 60 * 5,
  });
};