

import React, { useState } from 'react';
import { Client, ClientProfile, Appointment } from '../types';
import { ChevronDownIcon, PlusIcon, TrashIcon, FileTextIcon } from './icons';
import Modal from './Modal';
import ClientHistoryModal from './ClientHistoryModal';

interface ClientsProps {
    clientProfiles: ClientProfile[];
    appointments: Appointment[];
    actions: {
        addClient: (client: Omit<Client, 'id'>) => void;
        deleteClient: (clientId: number) => void;
    };
    showNotification: (message: string) => void;
}

const formatPhoneNumber = (phone: string) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    if (cleaned.length === 11) {
        const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
    }
     if (cleaned.length === 10) {
        const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
    }
    return phone;
};

const ClientForm: React.FC<{
    onSave: (data: Omit<Client, 'id'>) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [phone, setPhone] = useState('');

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 11);
        let formatted = '';
        if (value.length > 0) {
            formatted = `(${value.substring(0, 2)}`;
        }
        if (value.length >= 3) {
            formatted += `) ${value.substring(2, 7)}`;
        }
        if (value.length >= 8) {
            formatted += `-${value.substring(7, 11)}`;
        }
        setPhone(formatted);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedPhone = phone.replace(/\D/g, '');
        onSave({ name, age: Number(age), phone: cleanedPhone });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Cliente</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Idade</label>
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
                    <input type="tel" value={phone} onChange={handlePhoneChange} required placeholder="(XX) XXXXX-XXXX" maxLength={15} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500" />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700">Salvar Cliente</button>
            </div>
        </form>
    );
};

const Clients: React.FC<ClientsProps> = ({ clientProfiles, appointments, actions, showNotification }) => {
    const [expandedClient, setExpandedClient] = useState<number | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedClientHistory, setSelectedClientHistory] = useState<{ profile: ClientProfile; appointments: Appointment[] } | null>(null);

    const toggleClient = (clientId: number) => {
        if (expandedClient === clientId) {
            setExpandedClient(null);
        } else {
            setExpandedClient(clientId);
        }
    };

    const handleSaveClient = (clientData: Omit<Client, 'id'>) => {
        actions.addClient(clientData);
        showNotification(`Cliente ${clientData.name} adicionado com sucesso!`);
        setModalOpen(false);
    };

    const handleDeleteClient = (e: React.MouseEvent, clientId: number) => {
        e.stopPropagation(); // Prevent row from expanding/collapsing
        actions.deleteClient(clientId);
        showNotification('Cliente excluído com sucesso!');
    };
    
    const handleViewHistory = (e: React.MouseEvent, clientProfile: ClientProfile) => {
        e.stopPropagation();
        const clientAppointments = appointments
            .filter(app => app.clientName === clientProfile.name)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setSelectedClientHistory({ profile: clientProfile, appointments: clientAppointments });
        setHistoryModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Clientes</h2>
                <button onClick={() => setModalOpen(true)} className="w-full md:w-auto flex items-center justify-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                    <PlusIcon />
                    Adicionar Cliente
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg">
                {/* Desktop Header */}
                <div className="hidden md:flex p-4 border-b border-gray-700 text-sm text-gray-400 items-center font-semibold">
                    <div className="flex-grow pl-8">Nome do Cliente</div>
                    <div className="w-48 text-right">Faturamento Total</div>
                    <div className="w-24 text-center">Ações</div>
                </div>
                {/* Client List */}
                <div className="space-y-1 md:space-y-0">
                    {clientProfiles.map((client) => (
                        <div key={client.id} className="bg-gray-800 md:hover:bg-gray-700/50 border-b border-gray-700/50 md:border-0 md:border-b">
                            {/* Main row container */}
                            <div className="flex items-start md:items-center p-4">
                                {/* Clickable area for expanding */}
                                <div className="flex-grow cursor-pointer" onClick={() => toggleClient(client.id)}>
                                    {/* --- Mobile View --- */}
                                    <div className="md:hidden">
                                        <div className="flex items-center">
                                            <ChevronDownIcon className={`w-5 h-5 mr-3 transition-transform duration-300 ${expandedClient === client.id ? 'rotate-180' : ''}`} />
                                            <span className="font-medium text-white"><span className="text-gray-500 font-normal text-xs">#{client.id}</span> {client.name}</span>
                                        </div>
                                        <div className="mt-3 pl-8">
                                            <p className="text-sm text-gray-400">Faturamento Total</p>
                                            <p className="text-lg text-green-400 font-bold">
                                                {client.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* --- Desktop View --- */}
                                    <div className="hidden md:flex items-center">
                                        <div className="flex-grow flex items-center">
                                            <ChevronDownIcon className={`w-5 h-5 mr-3 transition-transform duration-300 ${expandedClient === client.id ? 'rotate-180' : ''}`} />
                                            <span className="font-medium text-white"><span className="text-gray-500 font-normal text-xs">#{client.id}</span> {client.name}</span>
                                        </div>
                                        <div className="w-48 text-right text-green-400 font-bold">
                                            {client.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Action button container */}
                                <div className="pl-2 md:w-24 md:pl-0 flex justify-end md:justify-center">
                                    <button
                                        onClick={(e) => handleDeleteClient(e, client.id)}
                                        className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-gray-700"
                                        title="Excluir Cliente"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Expanded content */}
                            {expandedClient === client.id && (
                                <div className="px-4 pb-4 md:px-6 md:pb-6 pt-0 md:pt-2 bg-gray-800 md:bg-gray-900/50 animate-fade-in-down">
                                    <div className="flex justify-end border-b border-gray-700 pb-3 mb-3">
                                        <button
                                            onClick={(e) => handleViewHistory(e, client)}
                                            className="flex items-center text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            <FileTextIcon className="w-4 h-4 mr-1" />
                                            Ver Histórico Completo
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-400 mb-4">
                                        <strong>Telefone:</strong> {formatPhoneNumber(client.phone)}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
                                        <div>
                                            <h4 className="text-sm font-semibold text-amber-500 mb-2 border-b border-gray-700 pb-1">Serviços Realizados</h4>
                                            <ul className="space-y-2 text-gray-300 mt-3">
                                                {client.completedServices.length > 0 ? client.completedServices.map(s => (
                                                    <li key={s.serviceName} className="flex justify-between items-center text-sm">
                                                        <span>{s.serviceName}</span>
                                                        <span className="font-semibold text-gray-400">{s.count}x</span>
                                                    </li>
                                                )) : <li className="text-gray-500 italic">Nenhum serviço concluído.</li>}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-amber-500 mb-2 border-b border-gray-700 pb-1">Cancelamentos</h4>
                                            <p className="text-3xl font-bold text-center text-red-400 mt-4">{client.canceledAppointments}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Novo Cliente">
                <ClientForm onSave={handleSaveClient} onClose={() => setModalOpen(false)} />
            </Modal>
            
            <ClientHistoryModal 
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                clientHistory={selectedClientHistory}
            />
        </div>
    );
};

export default Clients;