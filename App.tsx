
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceRecord, GeoLocation, LeaveRequest, LeaveStatus } from './types';
import { ClockControl } from './components/ClockControl';
import { MonthlySummary } from './components/MonthlySummary';
import { AttendanceLog } from './components/AttendanceLog';
import { Login } from './components/Login';
import { ManagerDashboard } from './components/ManagerDashboard';
import { LogoutIcon, UserIcon } from './components/icons';
import { employees, Employee } from './data/employees';
import { SharedReportView } from './components/SharedReportView';
import { AISmartSearch } from './components/AISmartSearch';
import { LeaveManagement } from './components/LeaveManagement';
import { ArticleSelector } from './components/ArticleSelector';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [viewingUserEmail, setViewingUserEmail] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Routing effect
  useEffect(() => {
    const handleHashChange = () => {
        setRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
        window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Auth effect
  useEffect(() => {
    const loggedInUserEmail = localStorage.getItem('currentUserEmail');
    if (loggedInUserEmail) {
      const user = employees.find(e => e.email.toLowerCase() === loggedInUserEmail.toLowerCase());
      if (user) {
        setCurrentUser(user);
        setViewingUserEmail(user.email);
      }
    }
  }, []);

  // Data loading effect
  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem('allAttendanceRecords');
      if (storedRecords) setAllRecords(JSON.parse(storedRecords));

      const storedLeaves = localStorage.getItem('allLeaveRequests');
      if (storedLeaves) setAllLeaveRequests(JSON.parse(storedLeaves));

    } catch (error) {
      console.error("Failed to parse records from localStorage", error);
    }
  }, []);

  // Data saving effects
  useEffect(() => {
    localStorage.setItem('allAttendanceRecords', JSON.stringify(allRecords));
  }, [allRecords]);
  
  useEffect(() => {
    localStorage.setItem('allLeaveRequests', JSON.stringify(allLeaveRequests));
  }, [allLeaveRequests]);
  
  // Memoized values for the currently LOGGED IN user (for actions)
  const currentUserRecords = useMemo(() => {
    if (!currentUser) return [];
    return allRecords.filter(r => r.userEmail === currentUser.email);
  }, [allRecords, currentUser]);

  const currentUserLeaveRequests = useMemo(() => {
    if (!currentUser) return [];
    return allLeaveRequests.filter(r => r.userEmail === currentUser.email);
  }, [allLeaveRequests, currentUser]);

  const isClockedIn = useMemo(() => {
    if (currentUserRecords.length === 0) return false;
    const lastRecord = [...currentUserRecords].sort((a,b) => b.timestamp - a.timestamp)[0];
    return lastRecord.type === 'in';
  }, [currentUserRecords]);
  
  // Memoized values for the user whose report is being VIEWED (for display)
  const viewingUser = useMemo(() => {
    if (!viewingUserEmail) return null;
    return employees.find(e => e.email === viewingUserEmail);
  }, [viewingUserEmail]);

  const viewingUserRecords = useMemo(() => {
    if (!viewingUserEmail) return [];
    return allRecords.filter(r => r.userEmail === viewingUserEmail);
  }, [allRecords, viewingUserEmail]);

  const viewingUserLeaveRequests = useMemo(() => {
    if (!viewingUserEmail) return [];
    return allLeaveRequests.filter(r => r.userEmail === viewingUserEmail);
  }, [allLeaveRequests, viewingUserEmail]);


  const getPlaceNameFromCoords = async (location: GeoLocation): Promise<string | null> => {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'placename',
          payload: { latitude: location.latitude, longitude: location.longitude }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API call failed with status: ${response.status}`);
      }

      const data = await response.json();
      const json = JSON.parse(data.text);
      return json.address || "Unknown Location";
    } catch (error) {
        console.error("API proxy call for placename failed", error);
        return "Could not fetch place name";
    }
  };

  const getCurrentLocation = useCallback((): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported.');
        resolve(null);
        return;
      }
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const locationData = { latitude, longitude, accuracy };
          setCurrentLocation(locationData);
          resolve(locationData);
        },
        () => {
          setLocationError('Could not get location. Please enable permissions.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const addAttendanceRecord = async (type: 'in' | 'out') => {
    if (!currentUser) return;
    setIsLoading(true);
    const location = await getCurrentLocation();
    const placeName = location ? await getPlaceNameFromCoords(location) : null;
    
    const now = new Date();
    const currentTime = now.getHours() + now.getMinutes() / 60;
    const isClockInAllowed = currentTime >= 9.5 && currentTime <= 11.0;
    
    const newRecord: AttendanceRecord = {
      id: Date.now(),
      userEmail: currentUser.email,
      type,
      timestamp: Date.now(),
      location: location,
      placeName: placeName,
      status: type === 'in' && !isClockInAllowed ? 'pending' : 'approved',
    };
    
    setAllRecords(prevRecords => [...prevRecords, newRecord]);
    setIsLoading(false);
  };
  
  const handleApproveAttendance = (recordId: number) => {
    setAllRecords(prevRecords => 
      prevRecords.map(record => 
        record.id === recordId ? { ...record, status: 'approved' } : record
      )
    );
  };

  const handleAddLeaveRequest = (leaveRequest: Omit<LeaveRequest, 'id' | 'userEmail' | 'status' | 'requestTimestamp'>) => {
    if (!currentUser) return;
    const newLeaveRequest: LeaveRequest = {
        ...leaveRequest,
        id: Date.now(),
        userEmail: currentUser.email,
        requestTimestamp: Date.now(),
        status: leaveRequest.leaveType === 'sick' ? 'approved' : 'pending',
    };
    setAllLeaveRequests(prev => [...prev, newLeaveRequest]);
  }

  const handleUpdateLeaveStatus = (requestId: number, status: LeaveStatus) => {
    setAllLeaveRequests(prev => prev.map(req => req.id === requestId ? {...req, status} : req));
  }

  const handleAiSearch = async (query: string) => {
    if (!query) return;

    setIsAiLoading(true);
    setAiResult('');

    const simplifiedRecords = allRecords.map(({ userEmail, type, timestamp, status }) => ({
        userEmail,
        type,
        timestamp: new Date(timestamp).toISOString(),
        status
    }));

    const contextData = {
        articles: employees.map(({name, email, role}) => ({name, email, role})),
        records: simplifiedRecords,
    };

    try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'search',
            payload: { query, contextData }
          })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'AI search failed');
        }

        const data = await response.json();
        setAiResult(data.text);
    } catch (error) {
        console.error("AI search failed", error);
        setAiResult("Sorry, I couldn't process that request. Please try again.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleLogin = (email: string) => {
    const user = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (user) {
        setCurrentUser(user);
        setViewingUserEmail(user.email);
        localStorage.setItem('currentUserEmail', user.email);
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setViewingUserEmail(null);
    localStorage.removeItem('currentUserEmail');
  };

  const handleViewUserChange = (email: string) => {
    setViewingUserEmail(email);
  };

  if (route.startsWith('#/share/')) {
    return <SharedReportView />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              Raghavan Chaudhuri and Narayanan
            </h1>
             <p className="text-slate-500 mt-2 flex items-center text-sm capitalize">
                <UserIcon className="w-4 h-4 mr-2" /> {currentUser.email} ({currentUser.role})
            </p>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors duration-200 font-semibold py-2 px-4 rounded-lg bg-white shadow border border-slate-200 hover:border-blue-300">
            <LogoutIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ClockControl 
              isClockedIn={isClockedIn}
              onClockIn={() => addAttendanceRecord('in')}
              onClockOut={() => addAttendanceRecord('out')}
              isLoading={isLoading}
              location={currentLocation}
              locationError={locationError}
            />
             <LeaveManagement 
                leaveRequests={currentUserLeaveRequests}
                onSubmitRequest={handleAddLeaveRequest}
            />
            {currentUser.role === 'manager' && (
                <>
                    <AISmartSearch 
                        onSearch={handleAiSearch}
                        result={aiResult}
                        isLoading={isAiLoading}
                    />
                    <ManagerDashboard 
                        attendanceRecords={allRecords}
                        leaveRequests={allLeaveRequests}
                        onApproveAttendance={handleApproveAttendance}
                        onUpdateLeaveStatus={handleUpdateLeaveStatus}
                    />
                </>
            )}
          </div>
          <div className="lg:col-span-3 space-y-8">
            {currentUser.role === 'manager' && viewingUserEmail && (
              <ArticleSelector 
                articles={employees}
                managerEmail={currentUser.email}
                selectedEmail={viewingUserEmail}
                onSelectUser={handleViewUserChange}
              />
            )}
            <MonthlySummary 
                records={viewingUserRecords} 
                leaveRequests={viewingUserLeaveRequests}
                userEmail={viewingUser?.email || ''} 
            />
             <AttendanceLog 
                records={viewingUserRecords}
                title={currentUser.email === viewingUserEmail ? 'My History' : `${viewingUser?.name || 'Article'}'s History`}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
