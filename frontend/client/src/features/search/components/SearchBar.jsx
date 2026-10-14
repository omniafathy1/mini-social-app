import React from 'react';

export const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="w-full max-w-2xl mx-auto my-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث عن بوستات أو مستخدمين..."
          className="w-full px-4 py-3 pl-10 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 shadow-md transition-all"
        />
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          🔍
        </span>
      </div>
    </div>
  );
};