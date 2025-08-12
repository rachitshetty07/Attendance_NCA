import React from 'react';
import { GeoLocation } from '../types';
import { ClockIcon, LocationMarkerIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';

interface ClockControlProps {
  isClockedIn: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
  isLoading: boolean;
  location: GeoLocation | null;
  locationError: string | null;
}

export const ClockControl: React.FC<ClockControlProps> = ({
  isClockedIn,
  onClockIn,
  onClockOut,
  isLoading,
  location,
  locationError,
}) => {
  const now = new Date();
  const currentTime = now.getHours() + now.getMinutes() / 60;

  // Clock-in allowed between 9:30 AM (9.5) and 11:00 AM (11.0)
  const isClockInAllowed = currentTime >= 9.5 && currentTime <= 11.0;
  // Clock-out allowed after 6:00 PM (18.0)
  const isClockOutAllowed = currentTime >= 18.0;

  const isClockOutButtonDisabled = isLoading || !isClockOutAllowed;

  const buttonText = isClockedIn ? 'Clock Out' : 'Clock In';
  const buttonColor = isClockedIn 
    ? (isClockOutButtonDisabled ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600')
    : 'bg-green-500 hover:bg-green-600';
  const finalButtonDisabled = isClockedIn ? isClockOutButtonDisabled : isLoading;

  const statusText = isClockedIn ? 'You are currently CLOCKED IN.' : 'You are currently CLOCKED OUT.';
  const statusColor = isClockedIn ? 'text-green-600' : 'text-red-600';
  const Icon = isClockedIn ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Attendance Status</h2>
        <ClockIcon className="w-6 h-6 text-blue-500" />
      </div>

      <div className="text-center mb-6">
        <p className={`text-lg font-semibold ${statusColor}`}>{statusText}</p>
      </div>
      
      <button
        onClick={isClockedIn ? onClockOut : onClockIn}
        disabled={finalButtonDisabled}
        className={`w-full flex items-center justify-center text-white font-bold py-4 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed ${buttonColor}`}
      >
        <Icon className="w-6 h-6 mr-3" />
        {isLoading ? 'Processing...' : buttonText}
      </button>
      
      <div className="text-center text-sm text-slate-500 mt-3 h-4">
        {!isClockedIn && !isClockInAllowed && <p>Late entry will require manager approval.</p>}
        {isClockedIn && !isClockOutAllowed && <p>Clock-out is only available after 6:00 PM.</p>}
      </div>

      <div className="mt-6 text-slate-500 text-sm">
        <div className="flex items-center">
            <LocationMarkerIcon className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" />
            {locationError && <p className="text-red-500">{locationError}</p>}
            {!locationError && location && (
            <p>
                Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
            </p>
            )}
             {!locationError && !location && isLoading && (
              <p>Fetching coordinates...</p>
            )}
        </div>
      </div>
    </div>
  );
};
