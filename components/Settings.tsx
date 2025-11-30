
import React, { useState, useRef, useEffect } from 'react';
import { Settings, SpecialDay } from '../types';
import { PlusIcon, TrashIcon, ScissorsIcon, LogoutIcon, DownloadIcon } from './icons';

interface SettingsProps {
    settings: Settings;
    updateSettings: (newSettings: Settings) => void;
    showNotification: (message: string) => void;
    onLogout: () => void;
    onExportData: () => void;
}

const SettingsCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-3">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Settings: React.FC<SettingsProps> = ({ settings, updateSettings, showNotification, onLogout, onExportData }) => {
    const [formData, setFormData] = useState<Settings>(settings);
    const [newSpecialDay, setNewSpecialDay] = useState({
        date: '',
        isClosed: true,
        start: settings.businessHours.start,
        end: settings.businessHours.end,
    });
    const logoInputRef = useRef<HTMLInputElement>(null);
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

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

    return (
        <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Opções</h2>
                 <button type="submit" className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                    Salvar Alterações
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                </div>

                <div className="space-y-8">
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

                    <SettingsCard title="Dados e Privacidade">
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
            </div>
        </form>
    );
};

export default Settings;
