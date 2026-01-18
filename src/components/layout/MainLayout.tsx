import { useState } from 'react';
import Header from './Header';
import WeekSelector from '../week/WeekSelector';
import RosterGrid from '../roster/RosterGrid';
import { useAuth } from '../auth/AuthProvider';
import { Week, createWeek, formatDate, getWeekStart } from '@/models';

function getCurrentWeek(): Week {
  const today = new Date();
  const monday = getWeekStart(today);
  const startDate = formatDate(monday);
  // For now, use a placeholder week number
  return createWeek(startDate, 1);
}

export default function MainLayout() {
  const [selectedWeek, setSelectedWeek] = useState<Week>(getCurrentWeek);
  const { isLoggedIn, login, logout } = useAuth();

  const handleAuthClick = () => {
    if (isLoggedIn) {
      logout();
    } else {
      login();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header
        isLoggedIn={isLoggedIn}
        onLoginClick={handleAuthClick}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <WeekSelector
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />

          <RosterGrid week={selectedWeek} />
        </div>
      </main>
    </div>
  );
}
