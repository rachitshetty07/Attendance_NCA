import React from 'react';
import { AttendanceRecord } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, LocationMarkerIcon } from './icons';

interface AttendanceLogProps {
  records: AttendanceRecord[];
}

export const AttendanceLog: React.FC<AttendanceLogProps> = ({ records }) => {
    const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">My History</h2>
      <div className="max-h-[30rem] overflow-y-auto pr-2">
        {sortedRecords.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No attendance records yet.</p>
        ) : (
          <ul className="space-y-4">
            {sortedRecords.map(record => (
              <li key={record.id} className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${record.type === 'in' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {record.type === 'in' ? 
                        <ArrowRightIcon className="w-6 h-6 text-green-600" /> : 
                        <ArrowLeftIcon className="w-6 h-6 text-red-600" />
                    }
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800 capitalize">
                        Clock {record.type}
                      </p>
                      <p className="text-sm text-slate-500">{formatDate(record.timestamp)}</p>
                    </div>
                    {record.status === 'pending' && (
                       <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Pending</span>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <LocationMarkerIcon className="w-3 h-3 mr-1" />
                    {record.placeName ? (
                      <span>{record.placeName}</span>
                    ) : record.location ? (
                      <span>Lat: {record.location.latitude.toFixed(2)}, Lon: {record.location.longitude.toFixed(2)}</span>
                    ) : (
                      <span>Location not available</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
