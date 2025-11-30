
import React, { useState } from 'react';
import { useBarberData } from './hooks/useBarberData';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Services from './components/Services';
import Professionals from './components/Professionals';
import Reports from './components/Reports';
import Finance from './components/Finance';
import Clients from './components/Clients';
import Settings from './components/Settings';
import Notification from './components/Notification';
import BottomNav from './components/BottomNav';
import MobileMenuPage from './components/MobileMenuPage';
import Login from './components/Login';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');
    const [notification, setNotification] = useState<string | null>(null);
    const [professionalScheduleFilter, setProfessionalScheduleFilter] = useState<string | null>(null);


    const { 
        services, 
        appointments, 
        expenses,
        clients,
        professionals,
        settings,
        filteredAppointments,
        filteredExpenses,
        clientProfiles,
        kpis, 
        topServices,
        revenueByService,
        historicalData,
        selectedMonth,
        setSelectedMonth,
        actions 
    } = useBarberData();

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        // Reset view to dashboard for next login
        setCurrentView('dashboard');
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} shopLogoUrl={settings.shopLogoUrl} />;
    }

    const showNotification = (message: string) => {
        setNotification(message);
    };

    const handleViewProfessionalSchedule = (professionalId: string) => {
        setProfessionalScheduleFilter(professionalId);
        setCurrentView('schedule');
    };

    const handleExportData = () => {
        const dataToExport = {
            timestamp: new Date().toISOString(),
            settings,
            services,
            appointments,
            clients,
            professionals,
            expenses
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `effisync_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showNotification('Dados exportados com sucesso!');
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard kpis={kpis} appointments={filteredAppointments} topServices={topServices} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} settings={settings} />;
            case 'schedule':
                return <Schedule appointments={appointments} services={services} clients={clients} professionals={professionals} actions={actions} showNotification={showNotification} professionalFilter={professionalScheduleFilter} setProfessionalFilter={setProfessionalScheduleFilter} settings={settings} />;
            case 'services':
                return <Services services={services} actions={actions} showNotification={showNotification} />;
            case 'professionals':
                return <Professionals professionals={professionals} actions={actions} showNotification={showNotification} onViewSchedule={handleViewProfessionalSchedule} />;
            case 'clients':
                 return <Clients clientProfiles={clientProfiles} appointments={appointments} actions={actions} showNotification={showNotification} />;
            case 'reports':
                return <Reports 
                    historicalData={historicalData} 
                    fullData={{ kpis, services, appointments: filteredAppointments, expenses: filteredExpenses, professionals, settings }} 
                    revenueByService={revenueByService} 
                    selectedMonth={selectedMonth} 
                    setSelectedMonth={setSelectedMonth} 
                />;
            case 'finance':
                return <Finance expenses={filteredExpenses} appointments={filteredAppointments} kpis={kpis} actions={actions} showNotification={showNotification} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} historicalData={historicalData} />;
            case 'settings':
                return <Settings settings={settings} updateSettings={actions.updateSettings} showNotification={showNotification} onLogout={handleLogout} onExportData={handleExportData} />;
            case 'menu':
                return <MobileMenuPage setCurrentView={setCurrentView} shopName={settings.shopName} shopLogoUrl={settings.shopLogoUrl} onLogout={handleLogout} />;
            default:
                return <Dashboard kpis={kpis} appointments={filteredAppointments} topServices={topServices} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} settings={settings} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} shopName={settings.shopName} shopLogoUrl={settings.shopLogoUrl} onLogout={handleLogout} />
            <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-20 md:pb-10">
                {renderView()}
            </main>
            <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
            {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
        </div>
    );
};

export default App;
