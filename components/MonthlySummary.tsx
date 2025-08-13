
import React, { useMemo, useState } from 'react';
import { AttendanceRecord, LeaveRequest } from '../types';
import { CalendarIcon, LocationMarkerIcon, DownloadIcon, ShareIcon } from './icons';
import * as XLSX from 'xlsx';

interface MonthlySummaryProps {
  records: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  userEmail: string;
}

type DayStatus = 'Present' | 'Personal Leave' | 'Sick Leave' | 'Holiday' | 'Absent' | 'Future' | 'Additional Work';

interface DayData {
    date: Date;
    status: DayStatus;
    clockIn: AttendanceRecord | null;
    clockOut: AttendanceRecord | null;
    leaveRequest: LeaveRequest | null;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ records, leaveRequests, userEmail }) => {
  const [copied, setCopied] = useState(false);

  const summaryData = useMemo((): DayData[] => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dailyData: DayData[] = [];

    const isHoliday = (d: Date): boolean => {
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 0) return true; // Sunday is a holiday
        if (dayOfWeek === 6) { // It's a Saturday
            const weekOfMonth = Math.ceil(d.getDate() / 7);
            // 1st and 3rd are workdays, so they are NOT holidays. All others are.
            return weekOfMonth !== 1 && weekOfMonth !== 3;
        }
        return false;
    };

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        if (date > now) {
            dailyData.push({ date, status: 'Future', clockIn: null, clockOut: null, leaveRequest: null });
            continue;
        }

        const dateString = date.toDateString();
        
        const approvedLeave = leaveRequests.find(req => {
            const startDate = new Date(req.startDate);
            startDate.setUTCHours(0,0,0,0);
            const endDate = new Date(req.endDate);
            endDate.setUTCHours(0,0,0,0);
            return req.status === 'approved' && date >= startDate && date <= endDate;
        });

        if (approvedLeave) {
            dailyData.push({ date, status: approvedLeave.leaveType === 'sick' ? 'Sick Leave' : 'Personal Leave', clockIn: null, clockOut: null, leaveRequest: approvedLeave });
            continue;
        }

        const dayRecords = records.filter(r => new Date(r.timestamp).toDateString() === dateString);
        const clockIn = dayRecords.find(r => r.type === 'in' && r.status === 'approved') || null;
        const dateIsHoliday = isHoliday(date);

        if (clockIn) {
            const clockOut = dayRecords.find(r => r.type === 'out') || null;
            if (dateIsHoliday) {
                dailyData.push({ date, status: 'Additional Work', clockIn, clockOut, leaveRequest: null });
            } else {
                dailyData.push({ date, status: 'Present', clockIn, clockOut, leaveRequest: null });
            }
        } else {
            if (dateIsHoliday) {
                dailyData.push({ date, status: 'Holiday', clockIn: null, clockOut: null, leaveRequest: null });
            } else {
                dailyData.push({ date, status: 'Absent', clockIn: null, clockOut: null, leaveRequest: null });
            }
        }
    }

    return dailyData.reverse();
  }, [records, leaveRequests]);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysPresent = summaryData.filter(d => d.status === 'Present').length;
  const personalLeaveDays = summaryData.filter(d => d.status === 'Personal Leave').length;
  const sickLeaveDays = summaryData.filter(d => d.status === 'Sick Leave').length;
  const additionalDaysWorked = summaryData.filter(d => d.status === 'Additional Work').length;


  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const getStatusBadge = (status: DayStatus) => {
    const baseClasses = "text-xs font-semibold px-2 py-0.5 rounded-full";
    switch (status) {
        case 'Present': return <span className={`${baseClasses} bg-green-100 text-green-700`}>Present</span>;
        case 'Additional Work': return <span className={`${baseClasses} bg-purple-100 text-purple-700`}>Additional Work</span>;
        case 'Personal Leave': return <span className={`${baseClasses} bg-blue-100 text-blue-700`}>Personal Leave</span>;
        case 'Sick Leave': return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>Sick Leave</span>;
        case 'Absent': return <span className={`${baseClasses} bg-red-100 text-red-700`}>Absent</span>;
        case 'Holiday': return <span className={`${baseClasses} bg-slate-200 text-slate-600`}>Holiday</span>;
        default: return null;
    }
  }


  const handleDownload = () => {
    if (summaryData.length === 0) return;

    const dataForSheet = summaryData.slice().reverse().map(day => {
        const date = day.date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        const dayOfWeek = day.date.toLocaleDateString('en-US', { weekday: 'long' });
        
        let notes = '';
        if (day.status.includes('Leave') && day.leaveRequest) {
            notes = day.leaveRequest.reason;
        } else if (day.status === 'Present' && day.clockIn?.status === 'pending') {
            notes = 'Late clock-in pending approval';
        }

        return {
            'Date': date,
            'Day': dayOfWeek,
            'Status': day.status,
            'Clock In Time': day.clockIn ? formatTime(day.clockIn.timestamp) : 'N/A',
            'Clock In Location': day.clockIn?.placeName || 'N/A',
            'Clock Out Time': day.clockOut ? formatTime(day.clockOut.timestamp) : 'N/A',
            'Notes / Reason': notes
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');

    worksheet['!cols'] = [
        { wch: 12 }, // Date
        { wch: 12 }, // Day
        { wch: 15 }, // Status
        { wch: 15 }, // Clock In Time
        { wch: 30 }, // Clock In Location
        { wch: 15 }, // Clock Out Time
        { wch: 40 }, // Notes
    ];

    const fileName = `Monthly_Report_${userEmail}_${currentMonthName.replace(/\s/g, '_')}.xlsx`;
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
      <div className="p-4 mb-4 bg-slate-50 rounded-lg">
        <div className="mb-4">
            <p className="font-semibold text-slate-600">{currentMonthName}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{daysPresent}</p>
                <p className="text-slate-500 text-sm">Days Present</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{additionalDaysWorked}</p>
                <p className="text-slate-500 text-sm">Additional Days</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{personalLeaveDays}</p>
                <p className="text-slate-500 text-sm">Personal Leave</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{sickLeaveDays}</p>
                <p className="text-slate-500 text-sm">Sick Leave</p>
            </div>
        </div>
       </div>
      <div className="max-h-[40rem] overflow-y-auto pr-2 space-y-3">
        {summaryData.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No workdays recorded this month.</p>
        ) : (
          summaryData.map((day) => (
            <div key={day.date.toISOString()} className="bg-slate-100 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-700">{day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    {getStatusBadge(day.status)}
                </div>

              {(day.status === 'Present' || day.status === 'Additional Work') && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-green-600">Clock In</p>
                            {day.clockIn?.status === 'pending' && <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Pending</span>}
                        </div>
                        {day.clockIn ? (
                            <>
                            <p className="text-slate-800">{formatTime(day.clockIn.timestamp)}</p>
                            <div className="flex items-center text-slate-500">
                                <LocationMarkerIcon className="w-3 h-3 mr-1" />
                                <span>{day.clockIn.placeName || 'Location not available'}</span>
                            </div>
                            </>
                        ) : <p className="text-slate-400">Not recorded</p>}
                    </div>
                    <div>
                        <p className="font-semibold text-red-600">Clock Out</p>
                        {day.clockOut ? (
                            <>
                            <p className="text-slate-800">{formatTime(day.clockOut.timestamp)}</p>
                            <div className="flex items-center text-slate-500">
                                <LocationMarkerIcon className="w-3 h-3 mr-1" />
                                <span>{day.clockOut.placeName || 'Location not available'}</span>
                            </div>
                            </>
                        ) : <p className="text-slate-400">Not recorded</p>}
                    </div>
                </div>
              )}
               {(day.status === 'Personal Leave' || day.status === 'Sick Leave') && day.leaveRequest && (
                 <div className="mt-2 text-sm text-slate-600 bg-slate-200 p-2 rounded-md">
                    <p><span className="font-semibold">Reason:</span> {day.leaveRequest.reason}</p>
                 </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
