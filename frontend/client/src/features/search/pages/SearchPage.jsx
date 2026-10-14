import React, { useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';
import { useSearch } from '../hooks/useSearch';
import { useDebounce } from '../hooks/useDebounce';

export const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data, isLoading, isError } = useSearch(debouncedSearchTerm);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold text-center mb-6">global search 🔍</h1>
      
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <SearchResults data={data} isLoading={isLoading} isError={isError} />
    </div>
  );
};