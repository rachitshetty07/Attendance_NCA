
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceRecord, GeoLocation } from './types';
import { ClockControl } from './components/ClockControl';
import { MonthlySummary } from './components/MonthlySummary';
import { AttendanceLog } from './components/AttendanceLog';
import { Login } from './components/Login';
import { ManagerDashboard } from './components/ManagerDashboard';
import { LogoutIcon, UserIcon } from './components/icons';
import { GoogleGenAI, Type } from "@google/genai";
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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Provide a short place name for latitude: ${location.latitude}, longitude: ${location.longitude}. Include city and country. For example: 'San Francisco, USA'.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        place: { type: Type.STRING, description: "Short place name." }
                    }
                }
            }
        });
        const json = JSON.parse(response.text);
        return json.place || "Unknown Location";
    } catch (error) {
        console.error("Gemini API call failed", error);
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

    const systemInstruction = `You are a helpful HR assistant for 'Raghavan Chaudhuri and Narayanan'. Your task is to analyze the provided JSON data of employee attendance records to answer questions.
- The 'employees' array lists all employees.
- The 'records' array contains all clock-in/out events.
- 'status: pending' means a late clock-in requires manager approval.
- Today's date is ${new Date().toDateString()}.
- Base your answers strictly on the data provided.
- Be concise and clear. Format your answer for readability.
- If the data is insufficient to answer, say so.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Question: "${query}"\n\nJSON Data:\n${JSON.stringify(contextData, null, 2)}`,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
            }
        });
        setAiResult(response.text);
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
