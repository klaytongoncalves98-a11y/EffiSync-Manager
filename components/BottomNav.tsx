import React from 'react';
import { DashboardIcon, ScheduleIcon, FinanceIcon, ReportsIcon, MenuIcon } from './icons';

interface BottomNavProps {
    currentView: string;
    setCurrentView: (view: string) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    view: string;
    currentView: string;
    onClick: () => void;
}> = ({ icon, label, view, currentView, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs font-medium transition-colors duration-200 ${
            currentView === view
                ? 'text-amber-500'
                : 'text-gray-400 hover:text-white'
        }`}
    >
        {icon}
        <span className="mt-1">{label}</span>
    </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around p-1 md:hidden z-50">
            <NavItem icon={<DashboardIcon />} label="Dashboard" view="dashboard" currentView={currentView} onClick={() => setCurrentView('dashboard')} />
            <NavItem icon={<ScheduleIcon />} label="Agenda" view="schedule" currentView={currentView} onClick={() => setCurrentView('schedule')} />
            <NavItem icon={<FinanceIcon />} label="Financeiro" view="finance" currentView={currentView} onClick={() => setCurrentView('finance')} />
            <NavItem icon={<ReportsIcon />} label="Relatórios" view="reports" currentView={currentView} onClick={() => setCurrentView('reports')} />
            <NavItem icon={<MenuIcon />} label="Mais" view="menu" currentView={currentView} onClick={() => setCurrentView('menu')} />
        </nav>
    );
};

export default BottomNav;