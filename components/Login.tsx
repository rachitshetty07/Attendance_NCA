
import React, { useState } from 'react';
import { employees } from '../data/employees';
import { UserIcon } from './icons';

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValidEmployee = employees.some(emp => emp.email.toLowerCase() === email.toLowerCase());
    
    if (isValidEmployee) {
      onLogin(email);
    } else {
      setError('This email address is not registered.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                Raghavan Chaudhuri and Narayanan
            </h1>
            <p className="text-slate-500 mt-2">Please sign in to continue</p>
        </div>
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                Article Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                    }}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
