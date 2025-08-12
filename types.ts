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
