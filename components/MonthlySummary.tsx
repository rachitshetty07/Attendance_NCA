
import React, { useMemo, useState } from 'react';
import { AttendanceRecord } from '../types';
import { CalendarIcon, LocationMarkerIcon, DownloadIcon, ShareIcon } from './icons';
import * as XLSX from 'xlsx';

interface MonthlySummaryProps {
  records: AttendanceRecord[];
  userEmail: string;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ records, userEmail }) => {
  const [copied, setCopied] = useState(false);

  const summaryData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const dailyRecords: { [key: string]: { in: AttendanceRecord[], out: AttendanceRecord[] } } = {};

    records.forEach(record => {
      const recordDate = new Date(record.timestamp);
      if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
        const dateString = recordDate.toDateString();
        if (!dailyRecords[dateString]) {
          dailyRecords[dateString] = { in: [], out: [] };
        }
        dailyRecords[dateString][record.type].push(record);
      }
    });

    return Object.keys(dailyRecords)
      .map(dateString => {
        const day = dailyRecords[dateString];
        // Earliest clock-in and latest clock-out
        const clockIn = day.in.sort((a, b) => a.timestamp - b.timestamp)[0] || null;
        const clockOut = day.out.sort((a, b) => b.timestamp - a.timestamp)[0] || null;
        return { date: dateString, clockIn, clockOut };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalWorkedDays = summaryData.filter(d => d.clockIn && d.clockIn.status === 'approved').length;

  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleDownload = () => {
    if (summaryData.length === 0) return;

    const dataForSheet = summaryData.map(day => {
        const date = new Date(day.date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const clockInTime = day.clockIn ? formatTime(day.clockIn.timestamp) : 'N/A';
        const clockInLocation = day.clockIn?.placeName || 'N/A';
        const clockInStatus = day.clockIn ? (day.clockIn.status === 'pending' ? 'Pending Approval' : 'Approved') : 'N/A';
        const clockOutTime = day.clockOut ? formatTime(day.clockOut.timestamp) : 'N/A';
        const clockOutLocation = day.clockOut?.placeName || 'N/A';

        return {
            'Date': date,
            'Clock In Time': clockInTime,
            'Clock In Location': clockInLocation,
            'Status': clockInStatus,
            'Clock Out Time': clockOutTime,
            'Clock Out Location': clockOutLocation
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');

    worksheet['!cols'] = [
        { wch: 12 }, // Date
        { wch: 15 }, // Clock In Time
        { wch: 30 }, // Clock In Location
        { wch: 18 }, // Status
        { wch: 15 }, // Clock Out Time
        { wch: 30 }, // Clock Out Location
    ];

    const fileName = `Monthly_Report_${currentMonthName.replace(/\s/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleShare = () => {
    const token = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const now = new Date();
    const shareData = {
        userEmail: userEmail,
        month: now.getMonth(),
        year: now.getFullYear(),
    };

    const storedSharesRaw = localStorage.getItem('sharedReports');
    const storedShares = storedSharesRaw ? JSON.parse(storedSharesRaw) : {};
    storedShares[token] = shareData;
    localStorage.setItem('sharedReports', JSON.stringify(storedShares));

    const shareUrl = `${window.location.origin}${window.location.pathname}#/share/${token}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-slate-800">Monthly Report</h2>
        </div>
        <div className="flex items-center gap-2">
            <button
            onClick={handleDownload}
            disabled={summaryData.length === 0}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-colors disabled:bg-slate-200"
            >
            <DownloadIcon className="w-4 h-4" />
            <span>Download</span>
            </button>
            <button
            onClick={handleShare}
            disabled={summaryData.length === 0}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg transition-colors disabled:bg-slate-200"
            >
            <ShareIcon className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
        </div>
      </div>
       <div className="flex items-baseline justify-between p-4 mb-4 bg-slate-50 rounded-lg">
        <div>
            <p className="text-slate-500">{currentMonthName}</p>
            <p className="text-3xl font-bold text-blue-600">{totalWorkedDays}</p>
            <p className="text-slate-500">Total Approved Days</p>
        </div>
      </div>
      <div className="max-h-[40rem] overflow-y-auto pr-2 space-y-3">
        {summaryData.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No workdays recorded this month.</p>
        ) : (
          summaryData.map(({ date, clockIn, clockOut }) => (
            <div key={date} className="bg-slate-100 p-4 rounded-lg">
              <p className="font-bold text-slate-700">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                     <p className="font-semibold text-green-600">Clock In</p>
                      {clockIn?.status === 'pending' && <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Pending</span>}
                  </div>
                  {clockIn ? (
                    <>
                      <p className="text-slate-800">{formatTime(clockIn.timestamp)}</p>
                      <div className="flex items-center text-slate-500">
                        <LocationMarkerIcon className="w-3 h-3 mr-1" />
                        <span>{clockIn.placeName || 'Location not available'}</span>
                      </div>
                    </>
                  ) : <p className="text-slate-400">Not recorded</p>}
                </div>
                <div>
                    <p className="font-semibold text-red-600">Clock Out</p>
                    {clockOut ? (
                        <>
                        <p className="text-slate-800">{formatTime(clockOut.timestamp)}</p>
                        <div className="flex items-center text-slate-500">
                            <LocationMarkerIcon className="w-3 h-3 mr-1" />
                            <span>{clockOut.placeName || 'Location not available'}</span>
                        </div>
                        </>
                    ) : <p className="text-slate-400">Not recorded</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};