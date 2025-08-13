
import React from 'react';
import { Employee } from '../data/employees';
import { UserIcon } from './icons';

interface ArticleSelectorProps {
  articles: Employee[];
  managerEmail: string;
  selectedEmail: string;
  onSelectUser: (email: string) => void;
}

export const ArticleSelector: React.FC<ArticleSelectorProps> = ({
  articles,
  managerEmail,
  selectedEmail,
  onSelectUser,
}) => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-4 border border-slate-200">
      <label htmlFor="article-select" className="block text-sm font-bold text-slate-700 mb-2">
        View Report For:
      </label>
      <div className="relative">
        <UserIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 transform -translate-y-1/2 pointer-events-none" />
        <select
          id="article-select"
          value={selectedEmail}
          onChange={(e) => onSelectUser(e.target.value)}
          className="w-full pl-10 pr-8 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
        >
          <option value={managerEmail}>My Report</option>
          {articles
            .filter(a => a.role === 'article')
            .map(article => (
              <option key={article.id} value={article.email}>
                {article.name}
              </option>
            ))}
        </select>
         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
};
