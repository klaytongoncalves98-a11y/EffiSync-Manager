
import React, { useState, useRef, useEffect } from 'react';
import { Settings, SpecialDay, ThemeSettings } from '../types';
import { PlusIcon, TrashIcon, ScissorsIcon, LogoutIcon, DownloadIcon } from './icons';
import Modal from './Modal';

interface SettingsProps {
    settings: Settings;
    currentUserEmail: string;
    updateSettings: (newSettings: Settings) => void;
    showNotification: (message: string) => void;
    onLogout: () => void;
    onExportData: () => void;
    onFactoryReset: () => void;
}

const SettingsCard: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-3">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

// Predefined themes
const THEME_PRESETS: { name: string, theme: ThemeSettings }[] = [
    {
        name: 'Modo Escuro (Padrão)',
        theme: {
            backgroundColor: '#111827',
            cardColor: '#1f2937',
            sidebarColor: '#1f2937',
            textColor: '#e5e7eb',
            secondaryTextColor: '#9ca3af',
            accentColor: '#06b6d4', // cyan-500
            inputColor: '#374151',
        }
    },
    {
        name: 'Midnight Blue',
        theme: {
            backgroundColor: '#0f172a',
            cardColor: '#1e293b',
            sidebarColor: '#0f172a',
            textColor: '#f8fafc',
            secondaryTextColor: '#94a3b8',
            accentColor: '#3b82f6',
            inputColor: '#334155',
        }
    },
    {
        name: 'Floresta Noturna',
        theme: {
            backgroundColor: '#052e16',
            cardColor: '#14532d',
            sidebarColor: '#064e3b',
            textColor: '#f0fdf4',
            secondaryTextColor: '#86efac',
            accentColor: '#22c55e',
            inputColor: '#166534',
        }
    },
    {
        name: 'Modo Claro (Beta)',
        theme: {
            backgroundColor: '#f3f4f6',
            cardColor: '#ffffff',
            sidebarColor: '#ffffff',
            textColor: '#111827',
            secondaryTextColor: '#4b5563',
            accentColor: '#06b6d4',
            inputColor: '#e5e7eb',
        }
    },
];

const Settings: React.FC<SettingsProps> = ({ settings, currentUserEmail, updateSettings, showNotification, onLogout, onExportData, onFactoryReset }) => {
    const [formData, setFormData] = useState<Settings>(settings);
    const [newSpecialDay, setNewSpecialDay] = useState({
        date: '',
        isClosed: true,
        start: settings.businessHours.start,
        end: settings.businessHours.end,
    });
    
    // Reset Logic State
    const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

    // Security Update State
    const [securityForm, setSecurityForm] = useState({
        newEmail: currentUserEmail,
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    const logoInputRef = useRef<HTMLInputElement>(null);
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    useEffect(() => {
        setSecurityForm(prev => ({ ...prev, newEmail: currentUserEmail }));
    }, [currentUserEmail]);

    // Live Preview Effect
    useEffect(() => {
        if (formData.theme) {
            const root = document.documentElement;
            // Apply current form theme settings to CSS variables for live preview
            root.style.setProperty('--app-bg', formData.theme.backgroundColor);
            root.style.setProperty('--card-bg', formData.theme.cardColor);
            root.style.setProperty('--sidebar-bg', formData.theme.sidebarColor || formData.theme.cardColor);
            root.style.setProperty('--text-main', formData.theme.textColor);
            root.style.setProperty('--text-sec', formData.theme.secondaryTextColor);
            root.style.setProperty('--accent', formData.theme.accentColor);
            root.style.setProperty('--input-bg', formData.theme.inputColor);
        }

        // Cleanup: revert to saved settings if component unmounts without saving
        return () => {
            if (settings.theme) {
                const root = document.documentElement;
                root.style.setProperty('--app-bg', settings.theme.backgroundColor);
                root.style.setProperty('--card-bg', settings.theme.cardColor);
                root.style.setProperty('--sidebar-bg', settings.theme.sidebarColor || settings.theme.cardColor);
                root.style.setProperty('--text-main', settings.theme.textColor);
                root.style.setProperty('--text-sec', settings.theme.secondaryTextColor);
                root.style.setProperty('--accent', settings.theme.accentColor);
                root.style.setProperty('--input-bg', settings.theme.inputColor);
            }
        };
    }, [formData.theme, settings.theme]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'start' || name === 'end') {
            setFormData(prev => ({
                ...prev,
                businessHours: { ...prev.businessHours, [name]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleRetentionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            dataRetention: {
                ...prev.dataRetention,
                [name]: type === 'checkbox' ? checked : Number(value)
            }
        }));
    };

    const handleThemeChange = (field: keyof ThemeSettings, value: string) => {
        setFormData(prev => ({
            ...prev,
            theme: {
                ...prev.theme!,
                [field]: value
            }
        }));
    };

    const applyPreset = (presetTheme: ThemeSettings) => {
        setFormData(prev => ({
            ...prev,
            theme: presetTheme
        }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, shopLogoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleWorkingDayToggle = (dayIndex: number) => {
        setFormData(prev => {
            const workingDays = prev.workingDays.includes(dayIndex)
                ? prev.workingDays.filter(d => d !== dayIndex)
                : [...prev.workingDays, dayIndex].sort();
            return { ...prev, workingDays };
        });
    };

    const handleAddSpecialDay = () => {
        if (newSpecialDay.date && !formData.specialDays.some(d => d.date === newSpecialDay.date)) {
            const dayToAdd: SpecialDay = {
                date: newSpecialDay.date,
                isClosed: newSpecialDay.isClosed,
            };
            if (!newSpecialDay.isClosed) {
                if (newSpecialDay.start >= newSpecialDay.end) {
                    alert("O horário de início deve ser anterior ao horário de término para o dia especial.");
                    return;
                }
                dayToAdd.hours = {
                    start: newSpecialDay.start,
                    end: newSpecialDay.end,
                };
            }

            setFormData(prev => ({
                ...prev,
                specialDays: [...prev.specialDays, dayToAdd].sort((a, b) => a.date.localeCompare(b.date))
            }));
            
            setNewSpecialDay({
                date: '',
                isClosed: true,
                start: settings.businessHours.start,
                end: settings.businessHours.end,
            });
        }
    };

    const handleRemoveSpecialDay = (dateToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            specialDays: prev.specialDays.filter(d => d.date !== dateToRemove)
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple validation for hours
        if (formData.businessHours.start >= formData.businessHours.end) {
            alert("O horário de início deve ser anterior ao horário de término.");
            return;
        }
        if (formData.workingDays.length === 0) {
            alert("Selecione pelo menos um dia de funcionamento.");
            return;
        }
        updateSettings(formData);
        showNotification("Opções salvas com sucesso!");
    };

    const handleSecurityUpdate = () => {
        const storedUsersStr = localStorage.getItem('effisync_users');
        const users = storedUsersStr ? JSON.parse(storedUsersStr) : [];
        
        const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === currentUserEmail.toLowerCase());
        
        if (userIndex === -1 && currentUserEmail !== 'admin') {
             // Should verify logic if user logged in via fallback without registration
             alert('Erro: Usuário não encontrado no banco de dados local.');
             return;
        }

        if (securityForm.newPassword !== securityForm.confirmNewPassword) {
            alert('A nova senha e a confirmação não coincidem.');
            return;
        }

        if (securityForm.newPassword.length < 4) {
             alert('A nova senha deve ter pelo menos 4 caracteres.');
             return;
        }

        const currentUser = users[userIndex];
        
        // Check old password (supporting legacy plain text and new btoa)
        const oldPasswordInput = securityForm.oldPassword;
        let isOldPasswordCorrect = false;

        if (currentUser) {
            isOldPasswordCorrect = (currentUser.password === oldPasswordInput) || (currentUser.password === btoa(oldPasswordInput));
        } else if (currentUserEmail === 'admin') {
             // Fallback admin check
             isOldPasswordCorrect = oldPasswordInput === 'admin';
        }

        if (!isOldPasswordCorrect) {
            alert('A senha antiga está incorreta.');
            return;
        }

        // Update logic
        const updatedUser = {
            email: securityForm.newEmail,
            password: btoa(securityForm.newPassword)
        };

        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
        } else {
            // Create user entry for legacy admin if they change credentials
            users.push(updatedUser);
        }

        localStorage.setItem('effisync_users', JSON.stringify(users));
        
        if (securityForm.newEmail !== currentUserEmail) {
            // Update current user tracking if email changed
            localStorage.setItem('effisync_current_user', securityForm.newEmail);
        }

        showNotification('Credenciais atualizadas com sucesso!');
        setSecurityForm(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmNewPassword: '' }));
    };

    const handleFactoryResetStep1 = () => {
        setResetStep(1);
    };

    const handleFactoryResetStep2 = () => {
        setResetStep(2);
    };

    const handleFactoryResetFinal = () => {
        if (deleteConfirmationText === 'DELETAR TUDO') {
            onFactoryReset();
            showNotification('Dados resetados para o padrão de fábrica.');
            handleCloseReset();
        }
    };

    const handleCloseReset = () => {
        setResetStep(0);
        setDeleteConfirmationText('');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Opções</h2>
                 <button onClick={handleSave} className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                    Salvar Alterações
                </button>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSave}>
                <div className="space-y-8">
                     <SettingsCard title="Metas e Horários">
                        <div>
                            <label htmlFor="monthlyGoal" className="block text-sm font-medium text-gray-300 mb-1">Meta Mensal (R$)</label>
                            <input
                                type="number"
                                id="monthlyGoal"
                                name="monthlyGoal"
                                value={formData.monthlyGoal}
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div className="border-t border-gray-700 pt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Horário de Funcionamento</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start" className="block text-xs text-gray-400 mb-1">Início</label>
                                    <input
                                        type="time"
                                        id="start"
                                        name="start"
                                        value={formData.businessHours.start}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="end" className="block text-xs text-gray-400 mb-1">Término</label>
                                    <input
                                        type="time"
                                        id="end"
                                        name="end"
                                        value={formData.businessHours.end}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </SettingsCard>
                    <SettingsCard title="Informações da Barbearia">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600">
                                    {formData.shopLogoUrl ? (
                                        <img src={formData.shopLogoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ScissorsIcon className="w-12 h-12 text-gray-500" />
                                    )}
                                </div>
                                 <input
                                    type="file"
                                    ref={logoInputRef}
                                    onChange={handleLogoUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => logoInputRef.current?.click()}
                                    className="w-full mt-2 bg-gray-600 text-white px-2 py-1 rounded-lg hover:bg-gray-500 text-xs transition-colors"
                                >
                                    Alterar
                                </button>
                            </div>
                            <div className="flex-grow space-y-4">
                                <div>
                                    <label htmlFor="shopName" className="block text-sm font-medium text-gray-300 mb-1">Nome da Barbearia</label>
                                    <input
                                        type="text"
                                        id="shopName"
                                        name="shopName"
                                        value={formData.shopName}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="shopAddress" className="block text-sm font-medium text-gray-300 mb-1">Endereço</label>
                                    <input
                                        type="text"
                                        id="shopAddress"
                                        name="shopAddress"
                                        value={formData.shopAddress}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Segurança da Conta">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email de Login</label>
                                <input
                                    type="email"
                                    value={securityForm.newEmail}
                                    onChange={(e) => setSecurityForm(prev => ({ ...prev, newEmail: e.target.value }))}
                                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Senha Atual</label>
                                <input
                                    type="password"
                                    value={securityForm.oldPassword}
                                    onChange={(e) => setSecurityForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                                    placeholder="Digite sua senha atual"
                                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={securityForm.newPassword}
                                        onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar Senha</label>
                                    <input
                                        type="password"
                                        value={securityForm.confirmNewPassword}
                                        onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleSecurityUpdate}
                                disabled={!securityForm.oldPassword || !securityForm.newPassword}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                Atualizar Email e Senha
                            </button>
                        </div>
                    </SettingsCard>
                </div>

                <div className="space-y-8">
                     <SettingsCard title="Aparência e Personalização">
                        {formData.theme && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Temas Prontos</label>
                                    <div className="flex flex-wrap gap-2">
                                        {THEME_PRESETS.map((preset) => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                onClick={() => applyPreset(preset.theme)}
                                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white border border-gray-600"
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-700 pt-4">
                                     <p className="text-sm font-medium text-gray-300 mb-3">Personalização Manual</p>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div>
                                             <label className="block text-xs text-gray-400 mb-1">Fundo Principal</label>
                                             <div className="flex items-center space-x-2">
                                                 <input type="color" value={formData.theme.backgroundColor} onChange={(e) => handleThemeChange('backgroundColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                                                 <span className="text-xs text-gray-500">{formData.theme.backgroundColor}</span>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-xs text-gray-400 mb-1">Fundo dos Cards</label>
                                             <div className="flex items-center space-x-2">
                                                 <input type="color" value={formData.theme.cardColor} onChange={(e) => handleThemeChange('cardColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                                                 <span className="text-xs text-gray-500">{formData.theme.cardColor}</span>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-xs text-gray-400 mb-1">Barra Lateral</label>
                                             <div className="flex items-center space-x-2">
                                                 <input type="color" value={formData.theme.sidebarColor || formData.theme.cardColor} onChange={(e) => handleThemeChange('sidebarColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                                                 <span className="text-xs text-gray-500">{formData.theme.sidebarColor || formData.theme.cardColor}</span>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-xs text-gray-400 mb-1">Fundo dos Inputs</label>
                                             <div className="flex items-center space-x-2">
                                                 <input type="color" value={formData.theme.inputColor} onChange={(e) => handleThemeChange('inputColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                                                 <span className="text-xs text-gray-500">{formData.theme.inputColor}</span>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-xs text-gray-400 mb-1">Cor de Destaque</label>
                                             <div className="flex items-center space-x-2">
                                                 <input type="color" value={formData.theme.accentColor} onChange={(e) => handleThemeChange('accentColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                                                 <span className="text-xs text-gray-500">{formData.theme.accentColor}</span>
                                             </div>
                                         </div>
                                          <div>
                                             <label className="block text-xs text-gray-400 mb-1">Texto Principal</label>
                                             <div className="flex items-center space-x-2">
                                                 <input type="color" value={formData.theme.textColor} onChange={(e) => handleThemeChange('textColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                                                 <span className="text-xs text-gray-500">{formData.theme.textColor}</span>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="block text-xs text-gray-400 mb-1">Texto Secundário</label>
                                             <div className="flex items-center space-x-2">
                                                 <input type="color" value={formData.theme.secondaryTextColor} onChange={(e) => handleThemeChange('secondaryTextColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                                                 <span className="text-xs text-gray-500">{formData.theme.secondaryTextColor}</span>
                                             </div>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )}
                    </SettingsCard>

                    <SettingsCard title="Dias de Funcionamento & Folgas">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Dias da Semana</label>
                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map((day, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleWorkingDayToggle(index)}
                                        className={`px-4 py-2 text-sm rounded-md font-semibold transition-colors ${formData.workingDays.includes(index) ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div className="border-t border-gray-700 pt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Folgas Programadas / Feriados</label>
                            <div className="bg-gray-700/50 p-4 rounded-lg space-y-3">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="date"
                                        value={newSpecialDay.date}
                                        onChange={(e) => setNewSpecialDay(prev => ({ ...prev, date: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSpecialDay}
                                        disabled={!newSpecialDay.date || formData.specialDays.some(d => d.date === newSpecialDay.date)}
                                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                        title="Adicionar data"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {newSpecialDay.date && !formData.specialDays.some(d => d.date === newSpecialDay.date) && (
                                    <div className="space-y-3 pt-3 mt-3 border-t border-gray-600 animate-fade-in-down">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newSpecialDay.isClosed}
                                                onChange={(e) => setNewSpecialDay(prev => ({ ...prev, isClosed: e.target.checked }))}
                                                className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 text-amber-600 focus:ring-amber-500"
                                            />
                                            <span className="text-white">Não abrir neste dia (Fechado)</span>
                                        </label>
                                        {!newSpecialDay.isClosed && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Horário de Início</label>
                                                    <input
                                                        type="time"
                                                        value={newSpecialDay.start}
                                                        onChange={(e) => setNewSpecialDay(prev => ({ ...prev, start: e.target.value }))}
                                                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Horário de Término</label>
                                                    <input
                                                        type="time"
                                                        value={newSpecialDay.end}
                                                        onChange={(e) => setNewSpecialDay(prev => ({ ...prev, end: e.target.value }))}
                                                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                                 {formData.specialDays.length > 0 ? formData.specialDays.map(day => (
                                    <div key={day.date} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                                        <span className="text-gray-200">{new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                        <span className={`text-sm font-semibold ${day.isClosed ? 'text-red-400' : 'text-green-400'}`}>
                                            {day.isClosed ? 'Fechado' : `${day.hours?.start} - ${day.hours?.end}`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSpecialDay(day.date)}
                                            className="text-gray-400 hover:text-red-400"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 italic text-center">Nenhuma folga/feriado programado.</p>
                                )}
                            </div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Gestão de Dados">
                        <div>
                             <label htmlFor="retentionPeriod" className="block text-sm font-medium text-gray-300 mb-1">Retenção de Dados Históricos</label>
                             <select
                                id="period"
                                name="period"
                                value={formData.dataRetention?.period || 0}
                                onChange={handleRetentionChange}
                                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                             >
                                 <option value="0">Indefinido (Manter tudo)</option>
                                 <option value="6">6 Meses</option>
                                 <option value="12">1 Ano</option>
                                 <option value="24">2 Anos</option>
                                 <option value="60">5 Anos</option>
                             </select>
                             <p className="text-xs text-gray-400 mt-1">Dados mais antigos que o período selecionado serão arquivados ou excluídos automaticamente.</p>
                        </div>
                        <div className="flex items-center space-x-3 pt-2">
                             <input
                                type="checkbox"
                                id="autoBackup"
                                name="autoBackup"
                                checked={formData.dataRetention?.autoBackup || false}
                                onChange={handleRetentionChange}
                                className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 text-amber-600 focus:ring-amber-500"
                             />
                             <label htmlFor="autoBackup" className="text-sm text-white">Habilitar Backup Automático Semanal</label>
                        </div>
                         <div className="border-t border-gray-700 pt-4 mt-2">
                             <label className="block text-sm font-medium text-gray-300 mb-2">Exportação de Dados</label>
                             <button
                                type="button"
                                onClick={onExportData}
                                className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                             >
                                 <DownloadIcon className="w-5 h-5 mr-2" />
                                 <span>Baixar Backup Completo (.json)</span>
                             </button>
                             <p className="text-xs text-gray-400 mt-2">Baixe uma cópia completa de todos os seus dados para segurança ou migração.</p>
                         </div>
                    </SettingsCard>

                    <SettingsCard title="Zona de Perigo" className="border border-red-900/50 bg-red-900/10">
                         <div>
                             <label className="block text-sm font-medium text-red-400 mb-2">Resetar Aplicação</label>
                             <p className="text-xs text-gray-400 mb-3">Esta ação apaga todos os dados e restaura o aplicativo ao estado inicial de fábrica. Tenha certeza do que está fazendo.</p>
                             <button
                                type="button"
                                onClick={handleFactoryResetStep1}
                                className="w-full flex items-center justify-center bg-transparent border border-red-600 text-red-500 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                             >
                                 <TrashIcon className="w-5 h-5 mr-2" />
                                 <span>Resetar Dados de Fábrica</span>
                             </button>
                         </div>
                    </SettingsCard>

                    <SettingsCard title="Conta">
                        <button
                            type="button"
                            onClick={onLogout}
                            className="w-full md:w-auto flex items-center justify-center bg-red-600/20 text-red-300 px-4 py-3 rounded-lg hover:bg-red-600/40 transition-colors border border-red-500/30"
                        >
                            <LogoutIcon className="w-5 h-5 mr-2" />
                            <span>Sair da Conta</span>
                        </button>
                    </SettingsCard>
                </div>
            </form>

             {/* Reset Confirmation Modals */}
             <Modal isOpen={resetStep === 1} onClose={handleCloseReset} title="⚠️ Confirmação Necessária">
                <div className="space-y-4">
                    <p className="text-white text-lg font-semibold">Você tem certeza absoluta?</p>
                    <p className="text-gray-300">
                        Esta ação irá apagar <strong>PERMANENTEMENTE</strong> todos os clientes, agendamentos, configurações e histórico financeiro.
                    </p>
                    <p className="text-gray-300">
                        Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={handleCloseReset} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleFactoryResetStep2} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                            Continuar (Perigoso)
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={resetStep === 2} onClose={handleCloseReset} title="⚠️ Último Aviso">
                <div className="space-y-4">
                    <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-lg">
                        <p className="text-red-300 font-bold mb-2">Para confirmar a exclusão de todos os dados, digite "DELETAR TUDO" abaixo:</p>
                        <input 
                            type="text" 
                            className="w-full bg-gray-900 border border-red-500 text-white p-2 rounded"
                            placeholder="DELETAR TUDO"
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={handleCloseReset} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                            Cancelar
                        </button>
                        <button 
                            type="button" 
                            onClick={handleFactoryResetFinal} 
                            disabled={deleteConfirmationText !== 'DELETAR TUDO'}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Apagar Tudo Agora
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
