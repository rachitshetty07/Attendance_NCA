

import React, { useState } from 'react';
import { AttendanceRecord, LeaveRequest, LeaveStatus } from '../types';
import { UserIcon, ClockIcon, BriefcaseIcon, CalendarIcon } from './icons';

interface ManagerDashboardProps {
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onApproveAttendance: (recordId: number) => void;
  onUpdateLeaveStatus: (requestId: number, status: LeaveStatus) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ attendanceRecords, leaveRequests, onApproveAttendance, onUpdateLeaveStatus }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance');

  const pendingAttendance = attendanceRecords.filter(r => r.status === 'pending').sort((a, b) => b.timestamp - a.timestamp);
  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending').sort((a,b) => b.requestTimestamp - a.requestTimestamp);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const formatLeaveDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
        <div className="mb-4 border-b border-slate-200">
            <nav className="-mb-px flex space-x-6">
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`relative whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm ${activeTab === 'attendance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Attendance
                    {pendingAttendance.length > 0 && <span className="absolute top-3 -right-5 ml-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{pendingAttendance.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('leaves')}
                    className={`relative whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm ${activeTab === 'leaves' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Leaves
                    {pendingLeaves.length > 0 && <span className="absolute top-3 -right-5 ml-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{pendingLeaves.length}</span>}
                </button>
            </nav>
        </div>
        
        <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
            {activeTab === 'attendance' && (
                <>
                    <h3 className="text-lg font-bold text-slate-800">Pending Attendance Approvals</h3>
                    {pendingAttendance.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No pending attendance requests.</p>
                    ) : (
                        pendingAttendance.map(record => (
                            <div key={record.id} className="bg-slate-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <div className="font-semibold text-slate-700 flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>{record.userEmail}</span>
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{formatDate(record.timestamp)} (Late Clock-in)</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onApproveAttendance(record.id)}
                                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 text-sm"
                            >
                                Approve
                            </button>
                            </div>
                        ))
                    )}
                </>
            )}

            {activeTab === 'leaves' && (
                 <>
                    <h3 className="text-lg font-bold text-slate-800">Pending Leave Requests</h3>
                    {pendingLeaves.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No pending leave requests.</p>
                    ) : (
                        pendingLeaves.map(req => (
                            <div key={req.id} className="bg-slate-50 p-4 rounded-lg flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <div className="font-semibold text-slate-700 flex items-center gap-2">
                                            <UserIcon className="w-4 h-4" />
                                            <span>{req.userEmail}</span>
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-2 mt-1 capitalize">
                                            <BriefcaseIcon className="w-4 h-4" />
                                            <span>{req.leaveType} Leave</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600 font-medium bg-slate-200 px-3 py-1 rounded-lg flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>{formatLeaveDate(req.startDate)} to {formatLeaveDate(req.endDate)}</span>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-600 bg-slate-100 p-2 rounded-md">
                                    <p><span className="font-semibold">Reason:</span> {req.reason}</p>
                                </div>
                                <div className="flex gap-3 justify-end mt-2">
                                     <button
                                        onClick={() => onUpdateLeaveStatus(req.id, 'rejected')}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 text-sm"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => onUpdateLeaveStatus(req.id, 'approved')}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 text-sm"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    </div>
  );
};