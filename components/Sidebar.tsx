
import React from 'react';
import { DashboardIcon, ScheduleIcon, ServicesIcon, ReportsIcon, FinanceIcon, ScissorsIcon, UsersIcon, BriefcaseIcon, SettingsIcon, LogoutIcon, ShoppingBagIcon } from './icons';

interface SidebarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    shopName: string;
    shopLogoUrl?: string;
    onLogout: () => void;
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
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
            currentView === view
                ? 'bg-amber-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, shopName, shopLogoUrl, onLogout }) => {
    
    return (
        <aside className="bg-gray-800 w-64 min-h-screen flex-shrink-0 p-4 space-y-6 flex-col hidden md:flex">
            <div className="flex items-center justify-between">
                <div className="flex items-center text-white text-2xl font-bold">
                    {shopLogoUrl ? (
                        <img src={shopLogoUrl} alt="Logo" className="w-10 h-10 mr-2 rounded-full object-cover"/>
                    ) : (
                        <ScissorsIcon className="w-8 h-8 mr-2 text-amber-500" />
                    )}
                    <span>{shopName}</span>
                </div>
            </div>
            
            <nav className="flex-1 space-y-2">
                <NavItem icon={<DashboardIcon />} label="Dashboard" view="dashboard" currentView={currentView} onClick={() => setCurrentView('dashboard')} />
                <NavItem icon={<ScheduleIcon />} label="Agenda" view="schedule" currentView={currentView} onClick={() => setCurrentView('schedule')} />
                <NavItem icon={<UsersIcon />} label="Clientes" view="clients" currentView={currentView} onClick={() => setCurrentView('clients')} />
                <NavItem icon={<ServicesIcon />} label="Serviços" view="services" currentView={currentView} onClick={() => setCurrentView('services')} />
                <NavItem icon={<ShoppingBagIcon />} label="Produtos" view="products" currentView={currentView} onClick={() => setCurrentView('products')} />
                <NavItem icon={<BriefcaseIcon />} label="Profissionais" view="professionals" currentView={currentView} onClick={() => setCurrentView('professionals')} />
                <NavItem icon={<ReportsIcon />} label="Relatórios" view="reports" currentView={currentView} onClick={() => setCurrentView('reports')} />
                <NavItem icon={<FinanceIcon />} label="Financeiro" view="finance" currentView={currentView} onClick={() => setCurrentView('finance')} />
            </nav>

            <div className="border-t border-gray-700 pt-4 space-y-2">
                 <NavItem icon={<SettingsIcon />} label="Opções" view="settings" currentView={currentView} onClick={() => setCurrentView('settings')} />
                 <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-300 hover:bg-red-600/20 hover:text-red-300"
                 >
                    <LogoutIcon />
                    <span className="ml-3">Sair</span>
                 </button>
            </div>

            <div className="mt-auto text-center text-gray-500 text-xs">
                <p>&copy; {new Date().getFullYear()} EffiSync.com.br</p>
                <p>Feito com ❤️</p>
            </div>
        </aside>
    );
};

export default Sidebar;
