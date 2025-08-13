
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface AttendanceRecord {
  id: number;
  userEmail: string;
  type: 'in' | 'out';
  timestamp: number;
  location: GeoLocation | null;
  placeName: string | null;
  status: 'approved' | 'pending';
}

export interface DailySummary {
  date: string;
  clockIn: AttendanceRecord | null;
  clockOut: AttendanceRecord | null;
}

export type LeaveType = 'personal' | 'sick';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: number;
  userEmail: string;
  leaveType: LeaveType;
  startDate: string; // ISO string YYYY-MM-DD
  endDate: string; // ISO string YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  requestTimestamp: number;
}
