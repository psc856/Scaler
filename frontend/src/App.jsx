import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { CalendarProvider, useCalendar } from '@contexts/CalendarContext';
import Header from '@components/Header/Header';
import Sidebar from '@components/Sidebar/Sidebar';
import ViewSwitcher from '@components/ViewSwitcher/ViewSwitcher';
import CalendarView from '@components/Calendar/CalendarView';
import EventModal from '@components/EventModal/EventModal';
import AIAssistant from '@components/AIAssistant/AIAssistant';
import useKeyboardShortcuts from '@hooks/useKeyboardShortcuts';
import { Loader } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import './App.scss';

function App() {
  return (
    <CalendarProvider>
      <AppContent />
    </CalendarProvider>
  );
}

function AppContent() {
  const { openEventModal, goToToday, loading } = useCalendar();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'c': () => {
      openEventModal();
    },
    't': () => {
      goToToday();
    },
  });

  if (isInitializing) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <Loader size={48} className="spinning" />
          <h2>Google Calendar Clone</h2>
          <p>Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      
      <div className="app-body">
        <Sidebar />
        
        <main className="main-content">
          <div className="view-controls">
            <ViewSwitcher />
          </div>
          
          <div className="calendar-container">
            {loading && (
              <div className="calendar-loading">
                <Loader size={24} className="spinning" />
                <span>Loading events...</span>
              </div>
            )}
            <CalendarView />
          </div>
        </main>
      </div>

      <EventModal />
      <AIAssistant />
      
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="custom-toast"
      />
    </div>
  );
}

export default App;
