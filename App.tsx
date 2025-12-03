
import React, { useState, useEffect } from 'react';
import { useBarberData } from './hooks/useBarberData';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Services from './components/Services';
import Products from './components/Products';
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
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard');
    const [notification, setNotification] = useState<string | null>(null);
    const [professionalScheduleFilter, setProfessionalScheduleFilter] = useState<string | null>(null);


    const { 
        services, 
        products,
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

    // --- SESSION PERSISTENCE ---
    useEffect(() => {
        const checkSession = () => {
            const session = localStorage.getItem('effisync_session');
            const storedUser = localStorage.getItem('effisync_current_user');

            if (session === 'active') {
                setIsAuthenticated(true);
                if (storedUser) {
                    setCurrentUserEmail(storedUser);
                }
            }
            setIsLoadingSession(false);
        };
        checkSession();
    }, []);

    // --- THEME INJECTION ---
    useEffect(() => {
        if (settings.theme) {
            // We use generic variables mapped to the tailwind classes being overridden
            const root = document.documentElement;
            root.style.setProperty('--app-bg', settings.theme.backgroundColor);
            root.style.setProperty('--card-bg', settings.theme.cardColor);
            root.style.setProperty('--sidebar-bg', settings.theme.sidebarColor || settings.theme.cardColor);
            root.style.setProperty('--text-main', settings.theme.textColor);
            root.style.setProperty('--text-sec', settings.theme.secondaryTextColor);
            root.style.setProperty('--accent', settings.theme.accentColor);
            root.style.setProperty('--input-bg', settings.theme.inputColor);
        }
    }, [settings.theme]);

    const themeStyles = `
        /* Global overrides based on user settings */
        .bg-gray-900 { background-color: var(--app-bg) !important; }
        .bg-gray-800 { background-color: var(--card-bg) !important; }
        
        /* Specific override for sidebar to use sidebar-bg */
        aside.bg-gray-800 { background-color: var(--sidebar-bg) !important; }

        /* Input Backgrounds */
        .bg-gray-700 { background-color: var(--input-bg) !important; }
        input, select, textarea {
             background-color: var(--input-bg) !important;
             color: var(--text-main) !important;
        }

        .text-gray-200, .text-white { color: var(--text-main) !important; }
        
        /* Secondary Text */
        .text-gray-300, .text-gray-400, .text-gray-500 { color: var(--text-sec) !important; }
        
        .bg-amber-600 { background-color: var(--accent) !important; }
        .text-amber-500, .text-amber-400, .text-amber-600 { color: var(--accent) !important; }
        .focus\\:ring-amber-500:focus { --tw-ring-color: var(--accent) !important; }
        .hover\\:bg-amber-700:hover { filter: brightness(0.9); background-color: var(--accent) !important; }
    `;


    const handleLogin = (rememberMe: boolean, email: string) => {
        setIsAuthenticated(true);
        setCurrentUserEmail(email);
        
        localStorage.setItem('effisync_current_user', email);
        if (rememberMe) {
            localStorage.setItem('effisync_session', 'active');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUserEmail('');
        localStorage.removeItem('effisync_session');
        localStorage.removeItem('effisync_current_user');
        // Reset view to dashboard for next login
        setCurrentView('dashboard');
    };

    // Show nothing or a loader while checking session to prevent login screen flash
    if (isLoadingSession) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
    }

    if (!isAuthenticated) {
        return (
            <>
                <Login onLogin={handleLogin} shopLogoUrl={settings.shopLogoUrl} />
            </>
        );
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
            products,
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
            case 'products':
                return <Products products={products} clients={clients} actions={actions} showNotification={showNotification} />;
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
                return <Settings settings={settings} currentUserEmail={currentUserEmail} updateSettings={actions.updateSettings} showNotification={showNotification} onLogout={handleLogout} onExportData={handleExportData} onFactoryReset={actions.resetAllData} />;
            case 'menu':
                return <MobileMenuPage setCurrentView={setCurrentView} shopName={settings.shopName} shopLogoUrl={settings.shopLogoUrl} onLogout={handleLogout} />;
            default:
                return <Dashboard kpis={kpis} appointments={filteredAppointments} topServices={topServices} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} settings={settings} />;
        }
    };

    return (
        <>
            <style>{themeStyles}</style>
            <div className="flex h-screen bg-gray-900 text-gray-200">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} shopName={settings.shopName} shopLogoUrl={settings.shopLogoUrl} onLogout={handleLogout} />
                <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-20 md:pb-10">
                    {renderView()}
                </main>
                <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
                {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
            </div>
        </>
    );
};

export default App;
