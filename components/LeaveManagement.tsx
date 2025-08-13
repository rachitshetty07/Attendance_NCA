import React, { useState } from 'react';
import { LeaveRequest, LeaveType } from '../types';
import { BriefcaseIcon, CalendarIcon } from './icons';

interface LeaveManagementProps {
    leaveRequests: LeaveRequest[];
    onSubmitRequest: (request: Omit<LeaveRequest, 'id' | 'userEmail' | 'status' | 'requestTimestamp'>) => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({ leaveRequests, onSubmitRequest }) => {
    const [leaveType, setLeaveType] = useState<LeaveType>('personal');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const getTodayISO = () => new Date().toISOString().split('T')[0];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!startDate || !endDate || !reason) {
            setError('All fields are required.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            setError('Start date cannot be after end date.');
            return;
        }
        
        if (leaveType === 'personal') {
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
            if (start < oneWeekFromNow) {
                setError('Personal leave must be requested at least one week in advance.');
                return;
            }
        }
        
        onSubmitRequest({ leaveType, startDate, endDate, reason });
        // Reset form
        setLeaveType('personal');
        setStartDate('');
        setEndDate('');
        setReason('');
    };
    
    const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
        const baseClasses = "text-xs font-semibold px-2 py-1 rounded-full";
        switch (status) {
            case 'pending': return <span className={`${baseClasses} bg-orange-100 text-orange-700`}>Pending</span>;
            case 'approved': return <span className={`${baseClasses} bg-green-100 text-green-700`}>Approved</span>;
            case 'rejected': return <span className={`${baseClasses} bg-red-100 text-red-700`}>Rejected</span>;
        }
    }
    
    const sortedRequests = [...leaveRequests].sort((a,b) => b.requestTimestamp - a.requestTimestamp);

    return (
        <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BriefcaseIcon className="w-6 h-6 text-blue-500" />
                    Leave Management
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Leave Type</label>
                    <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="personal">Personal Leave</option>
                        <option value="sick">Sick Leave</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                        <input type="date" id="startDate" value={startDate} min={getTodayISO()} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                        <input type="date" id="endDate" value={endDate} min={startDate || getTodayISO()} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                    <label htmlFor="reason" className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                    <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Provide a reason for your leave" className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
                    Submit Leave Request
                </button>
            </form>

            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">My Leave History</h3>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                    {sortedRequests.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">You have no leave requests.</p>
                    ) : (
                        sortedRequests.map(req => (
                            <div key={req.id} className="bg-slate-50 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-slate-700 capitalize">{req.leaveType} Leave</p>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {getStatusBadge(req.status)}
                                </div>
                                <p className="text-sm text-slate-600 mt-2">{req.reason}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};