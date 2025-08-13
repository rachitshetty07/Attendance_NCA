
import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { employees } from '../data/employees';
import { UserIcon, CalendarIcon, LocationMarkerIcon } from './icons';

interface SharedReportMetadata {
    userEmail: string;
    month: number;
    year: number;
}

export const SharedReportView: React.FC = () => {
    const [reportData, setReportData] = useState<{ user: { name: string, email: string }, summary: any[], monthName: string, totalWorkedDays: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const hash = window.location.hash;
        const token = hash.startsWith('#/share/') ? hash.split('/')[2] : null;

        if (!token) {
            setError("Invalid share link.");
            return;
        }

        const allRecordsRaw = localStorage.getItem('allAttendanceRecords');
        const sharedReportsRaw = localStorage.getItem('sharedReports');

        if (!allRecordsRaw || !sharedReportsRaw) {
            setError("Report data not found. The link may have expired or is invalid.");
            return;
        }

        try {
            const allRecords: AttendanceRecord[] = JSON.parse(allRecordsRaw);
            const sharedReports: { [key: string]: SharedReportMetadata } = JSON.parse(sharedReportsRaw);
            const metadata = sharedReports[token];

            if (!metadata) {
                setError("Report not found. The link may be invalid.");
                return;
            }
            
            const user = employees.find(e => e.email === metadata.userEmail);
            if (!user) {
                 setError("Associated user not found.");
                 return;
            }

            const { month, year } = metadata;
            
            const userRecords = allRecords.filter(record => {
                const recordDate = new Date(record.timestamp);
                return record.userEmail === metadata.userEmail && recordDate.getMonth() === month && recordDate.getFullYear() === year;
            });
            
            const dailyRecords: { [key: string]: { in: AttendanceRecord[], out: AttendanceRecord[] } } = {};

            userRecords.forEach(record => {
                const recordDate = new Date(record.timestamp);
                const dateString = recordDate.toDateString();
                if (!dailyRecords[dateString]) {
                    dailyRecords[dateString] = { in: [], out: [] };
                }
                dailyRecords[dateString][record.type].push(record);
            });

            const summaryData = Object.keys(dailyRecords)
                .map(dateString => {
                    const day = dailyRecords[dateString];
                    const clockIn = day.in.sort((a, b) => a.timestamp - b.timestamp)[0] || null;
                    const clockOut = day.out.sort((a, b) => b.timestamp - a.timestamp)[0] || null;
                    return { date: dateString, clockIn, clockOut };
                })
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
            const totalWorkedDays = summaryData.filter(d => d.clockIn && d.clockIn.status === 'approved').length;

            setReportData({
                user: { name: user.name, email: user.email },
                summary: summaryData,
                monthName,
                totalWorkedDays
            });

        } catch (e) {
            console.error("Failed to parse shared report data", e);
            setError("There was an error loading the report data.");
        }

    }, []);

    const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
             <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                        Raghavan Chaudhuri and Narayanan
                    </h1>
                </div>
                <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200">
                    {error && (
                        <div className="text-center text-red-500 py-10">
                            <p className="text-xl font-bold">Could not load report</p>
                            <p>{error}</p>
                            <a href="/" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">Back to App</a>
                        </div>
                    )}
                    {reportData && (
                        <>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-4 border-b border-slate-200">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3"><UserIcon className="w-6 h-6 text-blue-500"/>{reportData.user.name}'s Report</h2>
                                    <p className="text-slate-500">{reportData.user.email}</p>
                                </div>
                                <a href="/" className="mt-4 sm:mt-0 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded-lg">
                                    Back to App
                                </a>
                            </div>

                            <div className="flex items-baseline justify-between p-4 mb-4 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-slate-500">{reportData.monthName}</p>
                                    <p className="text-3xl font-bold text-blue-600">{reportData.totalWorkedDays}</p>
                                    <p className="text-slate-500">Total Approved Days</p>
                                </div>
                                <CalendarIcon className="w-10 h-10 text-slate-300" />
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
                            {reportData.summary.length === 0 ? (
                                <p className="text-slate-500 text-center py-8">No workdays recorded for this month.</p>
                            ) : (
                            reportData.summary.map(({ date, clockIn, clockOut }) => (
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
