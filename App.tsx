
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
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userUid, setUserUid] = useState<string>('');
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard');
    const [notification, setNotification] = useState<string | null>(null);

    // Pass the unique user ID to the hook
    const { 
        services, products, appointments, expenses, clients, professionals, settings,
        filteredAppointments, filteredExpenses, clientProfiles, kpis, 
        topServices, revenueByService, historicalData, selectedMonth,
        setSelectedMonth, actions 
    } = useBarberData(userUid);

    useEffect(() => {
        // Guard against auth being undefined/null if Firebase isn't configured
        if (!auth) {
            const localSession = localStorage.getItem('effisync_session');
            const localUser = localStorage.getItem('effisync_current_user');
            if (localSession === 'active' && localUser) {
                setIsAuthenticated(true);
                setUserUid(localUser);
            }
            setIsLoadingSession(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setUserUid(user.uid);
                // Also sync local storage flag for "Remember Me" logic compatibility
                localStorage.setItem('effisync_session', 'active');
                localStorage.setItem('effisync_current_user', user.uid);
            } else {
                setIsAuthenticated(false);
                setUserUid('');
                // If Firebase says no user, clear the legacy local flags if they are tied to firebase flow
                if (localStorage.getItem('effisync_current_user')?.startsWith('fb_') || !localStorage.getItem('effisync_current_user')) {
                    localStorage.removeItem('effisync_session');
                    localStorage.removeItem('effisync_current_user');
                }
            }
            setIsLoadingSession(false);
        });
        
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
        }
        localStorage.removeItem('effisync_session');
        localStorage.removeItem('effisync_current_user');
        setIsAuthenticated(false);
        setCurrentView('dashboard');
    };

    const handleLoginSuccess = (rememberMe: boolean, identifier: string) => {
        setIsAuthenticated(true);
        setUserUid(identifier);
        if (rememberMe) {
            localStorage.setItem('effisync_session', 'active');
            localStorage.setItem('effisync_current_user', identifier);
        }
    };

    const showNotification = (message: string) => setNotification(message);

    if (isLoadingSession) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-cyan-500 font-bold tracking-widest text-xs uppercase">Carregando EffiSync...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLoginSuccess} shopLogoUrl={settings.shopLogoUrl} />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 overflow-hidden" style={{
            backgroundColor: settings.theme?.backgroundColor || '#111827',
            color: settings.theme?.textColor || '#e5e7eb'
        }}>
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} shopName={settings.shopName} shopLogoUrl={settings.shopLogoUrl} onLogout={handleLogout} />
            <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-24 md:pb-10 bg-gray-900" style={{
                backgroundColor: settings.theme?.backgroundColor || '#111827'
            }}>
                {currentView === 'dashboard' && <Dashboard kpis={kpis} appointments={filteredAppointments} topServices={topServices} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} settings={settings} />}
                {currentView === 'schedule' && <Schedule appointments={appointments} services={services} clients={clients} professionals={professionals} actions={actions} showNotification={showNotification} professionalFilter={null} setProfessionalFilter={() => {}} settings={settings} />}
                {currentView === 'clients' && <Clients clientProfiles={clientProfiles} appointments={appointments} actions={actions} showNotification={showNotification} />}
                {currentView === 'services' && <Services services={services} actions={actions} showNotification={showNotification} />}
                {currentView === 'products' && <Products products={products} clients={clients} actions={actions} showNotification={showNotification} />}
                {currentView === 'professionals' && <Professionals professionals={professionals} actions={actions} showNotification={showNotification} onViewSchedule={(id) => setCurrentView('schedule')} />}
                {currentView === 'reports' && <Reports historicalData={historicalData} fullData={{ kpis, services, appointments: filteredAppointments, expenses: filteredExpenses, professionals, settings }} revenueByService={revenueByService} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />}
                {currentView === 'finance' && <Finance expenses={filteredExpenses} appointments={filteredAppointments} kpis={kpis} actions={actions} showNotification={showNotification} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} historicalData={historicalData} />}
                {currentView === 'settings' && <Settings settings={settings} currentUserEmail={auth?.currentUser?.email || userUid} updateSettings={actions.updateSettings} showNotification={showNotification} onLogout={handleLogout} onExportData={() => {}} onFactoryReset={actions.resetAllData} />}
                {currentView === 'menu' && <MobileMenuPage setCurrentView={setCurrentView} shopName={settings.shopName} shopLogoUrl={settings.shopLogoUrl} onLogout={handleLogout} />}
            </main>
            <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
            {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
        </div>
    );
};

export default App;
