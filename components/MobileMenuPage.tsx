import React from 'react';
import {
    DashboardIcon, ScheduleIcon, ServicesIcon, ReportsIcon, FinanceIcon,
    UsersIcon, BriefcaseIcon, SettingsIcon, ScissorsIcon, LogoutIcon
} from './icons';

interface MobileMenuPageProps {
    setCurrentView: (view: string) => void;
    shopName: string;
    shopLogoUrl?: string;
    onLogout: () => void;
}

const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center w-full p-4 bg-gray-800 rounded-lg text-left hover:bg-gray-700 transition-colors duration-200"
    >
        <div className="p-2 bg-gray-700 rounded-full mr-4">
            {icon}
        </div>
        <span className="text-lg font-medium text-white">{label}</span>
    </button>
);

const MobileMenuPage: React.FC<MobileMenuPageProps> = ({ setCurrentView, shopName, shopLogoUrl, onLogout }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center text-white text-2xl font-bold">
                {shopLogoUrl ? (
                    <img src={shopLogoUrl} alt="Logo" className="w-10 h-10 mr-2 rounded-full object-cover"/>
                ) : (
                    <ScissorsIcon className="w-8 h-8 mr-2 text-amber-500" />
                )}
                <span>{shopName}</span>
            </div>
            <nav className="space-y-3">
                <MenuItem icon={<DashboardIcon />} label="Dashboard" onClick={() => setCurrentView('dashboard')} />
                <MenuItem icon={<ScheduleIcon />} label="Agenda" onClick={() => setCurrentView('schedule')} />
                <MenuItem icon={<ServicesIcon />} label="Serviços" onClick={() => setCurrentView('services')} />
                <MenuItem icon={<BriefcaseIcon />} label="Profissionais" onClick={() => setCurrentView('professionals')} />
                <MenuItem icon={<UsersIcon />} label="Clientes" onClick={() => setCurrentView('clients')} />
                <MenuItem icon={<ReportsIcon />} label="Relatórios" onClick={() => setCurrentView('reports')} />
                <MenuItem icon={<FinanceIcon />} label="Financeiro" onClick={() => setCurrentView('finance')} />
                <MenuItem icon={<SettingsIcon />} label="Opções" onClick={() => setCurrentView('settings')} />

                 <div className="pt-2 border-t border-gray-700">
                    <button
                        onClick={onLogout}
                        className="flex items-center w-full p-4 bg-red-900/50 rounded-lg text-left hover:bg-red-800/60 transition-colors duration-200"
                    >
                        <div className="p-2 bg-red-800/70 rounded-full mr-4">
                            <LogoutIcon className="text-red-300"/>
                        </div>
                        <span className="text-lg font-medium text-red-300">Sair</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default MobileMenuPage;
