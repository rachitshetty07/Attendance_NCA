import React from 'react';
import { AttendanceRecord } from '../types';
import { UserIcon, ClockIcon } from './icons';

interface ManagerDashboardProps {
  records: AttendanceRecord[];
  onApprove: (recordId: number) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ records, onApprove }) => {
  const pendingRecords = records.filter(r => r.status === 'pending').sort((a,b) => b.timestamp - a.timestamp);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Pending Approvals</h2>
      <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
        {pendingRecords.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No pending requests.</p>
        ) : (
          pendingRecords.map(record => (
            <div key={record.id} className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span>{record.userEmail}</span>
                </div>
                <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatDate(record.timestamp)}</span>
                </div>
              </div>
              <button
                onClick={() => onApprove(record.id)}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 text-sm"
              >
                Approve
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
