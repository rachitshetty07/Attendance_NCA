
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceRecord, GeoLocation } from './types';
import { ClockControl } from './components/ClockControl';
import { MonthlySummary } from './components/MonthlySummary';
import { AttendanceLog } from './components/AttendanceLog';
import { Login } from './components/Login';
import { ManagerDashboard } from './components/ManagerDashboard';
import { LogoutIcon, UserIcon } from './components/icons';
import { employees, Employee } from './data/employees';
import { SharedReportView } from './components/SharedReportView';
import { AISmartSearch } from './components/AISmartSearch';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
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
      }
    }
  }, []);

  // Data loading effect
  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem('allAttendanceRecords');
      if (storedRecords) {
        setAllRecords(JSON.parse(storedRecords));
      }
    } catch (error) {
      console.error("Failed to parse records from localStorage", error);
    }
  }, []);

  // Data saving effect
  useEffect(() => {
    localStorage.setItem('allAttendanceRecords', JSON.stringify(allRecords));
  }, [allRecords]);
  
  const currentUserRecords = useMemo(() => {
    if (!currentUser) return [];
    return allRecords.filter(r => r.userEmail === currentUser.email);
  }, [allRecords, currentUser]);

  const isClockedIn = useMemo(() => {
    if (currentUserRecords.length === 0) return false;
    const lastRecord = [...currentUserRecords].sort((a,b) => b.timestamp - a.timestamp)[0];
    return lastRecord.type === 'in';
  }, [currentUserRecords]);

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
      return json.place || "Unknown Location";
    } catch (error) {
        console.error("API proxy call failed for placename", error);
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
        employees: employees.map(({name, email, role}) => ({name, email, role})),
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
        localStorage.setItem('currentUserEmail', user.email);
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserEmail');
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
              Geo-Attendance
            </h1>
            <p className="text-slate-600 font-semibold mt-1">Raghavan Chaudhuri and Narayanan</p>
             <p className="text-slate-500 mt-2 flex items-center text-sm">
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
            {currentUser.role === 'manager' && (
                <>
                    <AISmartSearch 
                        onSearch={handleAiSearch}
                        result={aiResult}
                        isLoading={isAiLoading}
                    />
                    <ManagerDashboard 
                        records={allRecords}
                        onApprove={handleApproveAttendance}
                    />
                </>
            )}
            <AttendanceLog records={currentUserRecords} />
          </div>
          <div className="lg:col-span-3">
            <MonthlySummary records={currentUserRecords} userEmail={currentUser.email} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;