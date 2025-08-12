
import React, { useState } from 'react';
import { SparklesIcon } from './icons';

interface AISmartSearchProps {
  onSearch: (query: string) => void;
  result: string;
  isLoading: boolean;
}

export const AISmartSearch: React.FC<AISmartSearchProps> = ({ onSearch, result, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (!query.trim() || isLoading) return;
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-slate-800">AI-Powered Insights</h2>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Who was late this month?"
          disabled={isLoading}
          className="w-full pr-28 py-3 pl-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="absolute inset-y-0 right-0 flex items-center px-4 m-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-blue-300 transition-colors"
        >
          {isLoading ? 'Asking...' : 'Ask AI'}
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg min-h-[10rem] max-h-80 overflow-y-auto">
        {isLoading && (
             <div className="flex items-center justify-center h-full min-h-[10rem]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
        )}
        {!isLoading && !result && (
            <div className="text-center py-10 text-slate-400">
                <p>Ask a question to get AI-generated insights.</p>
                <p className="text-xs mt-2">Example: "How many days did Diana Miller work?"</p>
            </div>
        )}
        {!isLoading && result && (
            <p className="text-slate-700 whitespace-pre-wrap">{result}</p>
        )}
      </div>
    </div>
  );
};
