import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  pendientes?: number;
  pendientesAuth?: number;
}

export default function AppLayout({ children, pendientes = 0, pendientesAuth = 0 }: AppLayoutProps) {
  return (
    <div className="app">
      <Sidebar pendientes={pendientes} pendientesAuth={pendientesAuth}/>
      <div className="app-main">
        <Topbar/>
        <div className="app-content">
          <div className="app-content-narrow">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
