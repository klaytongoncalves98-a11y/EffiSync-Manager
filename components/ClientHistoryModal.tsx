import React from 'react';
import Modal from './Modal';
import { ClientProfile, Appointment, AppointmentStatus } from '../types';
import { CalendarIcon, CheckIcon, CancelIcon, FileTextIcon } from './icons';

interface ClientHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientHistory: { profile: ClientProfile; appointments: Appointment[] } | null;
}

const statusStyles = {
    [AppointmentStatus.COMPLETED]: {
        icon: <CheckIcon className="w-4 h-4" />,
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-300',
        label: 'Concluído'
    },
    [AppointmentStatus.PENDING]: {
        icon: <CalendarIcon className="w-4 h-4" />,
        bgColor: 'bg-yellow-500/20',
        textColor: 'text-yellow-300',
        label: 'Pendente'
    },
    [AppointmentStatus.CANCELED]: {
        icon: <CancelIcon className="w-4 h-4" />,
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-300',
        label: 'Cancelado'
    },
};

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({ isOpen, onClose, clientHistory }) => {
    if (!isOpen || !clientHistory) return null;

    const { profile, appointments } = clientHistory;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Histórico de ${profile.name}`}>
            <div className="text-white space-y-6">
                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-4 text-center bg-gray-900/50 p-4 rounded-lg">
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Faturamento Total</p>
                        <p className="text-lg font-bold text-green-400">{profile.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-400 uppercase">Agendamentos</p>
                        <p className="text-lg font-bold">{appointments.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Cancelamentos</p>
                        <p className="text-lg font-bold text-red-400">{profile.canceledAppointments}</p>
                    </div>
                </div>

                {/* Appointments List Section */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">Histórico de Agendamentos</h4>
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                        {appointments.length > 0 ? (
                            appointments.map(app => {
                                const statusInfo = statusStyles[app.status];
                                return (
                                    <div key={app.id} className="bg-gray-700/60 p-4 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{new Date(app.date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                                <div className={`mt-1 inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                                    {statusInfo.icon}
                                                    <span className="ml-1">{statusInfo.label}</span>
                                                </div>
                                            </div>
                                            {app.status === AppointmentStatus.COMPLETED && (
                                                <p className="text-green-400 font-bold">{app.finalPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            )}
                                        </div>
                                        <div className="mt-3 border-t border-gray-600 pt-3">
                                            <p className="text-sm text-gray-400">Serviços: <span className="text-gray-200">{app.services.map(s => s.name).join(', ')}</span></p>
                                            {app.notes && (
                                                 <p className="text-sm text-gray-400 mt-2 flex items-start">
                                                     <FileTextIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-1" />
                                                     <span className="text-gray-300 italic whitespace-pre-wrap">{app.notes}</span>
                                                 </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado para este cliente.</p>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ClientHistoryModal;
