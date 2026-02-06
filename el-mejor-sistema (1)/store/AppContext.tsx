
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, Client, Process, Payment, UserRole, User, ProcessStatus, PaymentStatus, Attachment, ServiceChannel, PaymentMethod, AppNotification } from '../types';
import { generateProtocol, calculateProcessFinancials } from '../utils/helpers';

const STORAGE_KEY = 'doctramite_shared_db';
const AUTH_KEY = 'doctramite_session';

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Carlos Oliveira', username: 'admin', role: UserRole.ADMIN },
  { id: 'u2', name: 'Fernanda Lima', username: 'operador1', role: UserRole.OPERATOR },
  { id: 'u3', name: 'Marcos Silva', username: 'financeiro', role: UserRole.FINANCIAL },
];

interface AddProcessData {
  clientId: string;
  documentType: string;
  totalValue: number;
  initialPayment: number;
  paymentMethod: PaymentMethod;
  channel: ServiceChannel;
  responsibleId: string;
  observations?: string;
}

interface AppContextType extends AppState {
  login: (username: string) => boolean;
  logout: () => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'attachments' | 'createdBy'>) => void;
  addProcess: (data: AddProcessData) => void;
  updateProcessStatus: (id: string, status: ProcessStatus) => string | null;
  addPayment: (payment: Omit<Payment, 'id' | 'createdBy'>) => void;
  addAttachment: (targetId: string, category: 'client' | 'process' | 'payment' | 'delivery', fileData: string) => void;
  clearNotifications: () => void;
  markNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSynced, setIsSynced] = useState(true);
  
  const [data, setData] = useState<{
    clients: Client[];
    processes: Process[];
    payments: Payment[];
    notifications: AppNotification[];
  }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { clients: [], processes: [], payments: [], notifications: [] };
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setData(JSON.parse(e.newValue));
        setIsSynced(true);
      }
      if (e.key === AUTH_KEY && !e.newValue) {
        setCurrentUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    const session = localStorage.getItem(AUTH_KEY);
    if (session) {
      const user = MOCK_USERS.find(u => u.id === session);
      if (user) setCurrentUser(user);
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const persistData = useCallback((newData: typeof data) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setIsSynced(true);
  }, []);

  const createNotification = (type: AppNotification['type'], message: string) => {
    if (!currentUser) return;
    const newNotif: AppNotification = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    persistData({ ...data, notifications: [newNotif, ...data.notifications].slice(0, 50) });
  };

  const login = (username: string) => {
    const user = MOCK_USERS.find(u => u.username === username.toLowerCase());
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(AUTH_KEY, user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  const addClient = (dataInput: Omit<Client, 'id' | 'createdAt' | 'attachments' | 'createdBy'>) => {
    if (!currentUser) return;
    const newClient: Client = {
      ...dataInput,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      attachments: [],
      createdBy: currentUser.id
    };
    createNotification('client', `Cadastrou o cliente ${newClient.name}`);
    persistData({ ...data, clients: [...data.clients, newClient] });
  };

  const addProcess = (input: AddProcessData) => {
    if (!currentUser) return;
    const protocol = generateProtocol();
    const processId = crypto.randomUUID();
    const { balance, status } = calculateProcessFinancials(input.totalValue, input.initialPayment || 0);

    const newProcess: Process = {
      id: processId,
      clientId: input.clientId,
      protocolNumber: protocol,
      documentType: input.documentType,
      status: ProcessStatus.ELABORATION,
      channel: input.channel,
      totalValue: input.totalValue,
      paidValue: input.initialPayment || 0,
      openBalance: balance,
      financialStatus: status as PaymentStatus,
      createdAt: new Date().toISOString(),
      responsibleId: input.responsibleId,
      observations: input.observations,
      attachments: [],
      createdBy: currentUser.id,
      history: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        action: 'Abertura de Processo',
        userId: currentUser.id,
        details: `Iniciado por ${currentUser.name}`
      }]
    };

    createNotification('process', `Abriu o processo ${protocol}`);
    persistData({
      ...data,
      processes: [...data.processes, newProcess],
      payments: input.initialPayment > 0 ? [...data.payments, {
        id: crypto.randomUUID(),
        processId,
        amount: input.initialPayment,
        date: new Date().toISOString(),
        method: input.paymentMethod,
        createdBy: currentUser.id
      }] : data.payments
    });
  };

  const updateProcessStatus = (id: string, status: ProcessStatus) => {
    if (!currentUser) return 'Não autenticado';
    const process = data.processes.find(p => p.id === id);
    if (!process) return 'Processo não encontrado';

    if (status === ProcessStatus.DELIVERED && process.openBalance > 0) {
      return 'Pagamento pendente para entrega.';
    }

    const updatedProcesses = data.processes.map(p => {
      if (p.id === id) {
        return { 
          ...p, 
          status, 
          history: [...p.history, {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            action: `Status: ${status}`,
            userId: currentUser.id,
            details: `Alterado por ${currentUser.name}`
          }]
        };
      }
      return p;
    });

    createNotification('process', `Alterou o status do processo ${process.protocolNumber} para ${status}`);
    persistData({ ...data, processes: updatedProcesses });
    return null;
  };

  const addPayment = (input: Omit<Payment, 'id' | 'createdBy'>) => {
    if (!currentUser) return;
    const newPayment: Payment = { ...input, id: crypto.randomUUID(), createdBy: currentUser.id };
    const process = data.processes.find(p => p.id === input.processId);
    if (!process) return;

    const newPaidValue = process.paidValue + input.amount;
    const { balance, status } = calculateProcessFinancials(process.totalValue, newPaidValue);

    const updatedProcesses = data.processes.map(p => {
      if (p.id === input.processId) {
        return {
          ...p,
          paidValue: newPaidValue,
          openBalance: balance,
          financialStatus: status as PaymentStatus,
          history: [...p.history, {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            action: 'Pagamento Recebido',
            userId: currentUser.id,
            details: `R$ ${input.amount} lançado por ${currentUser.name}`
          }]
        };
      }
      return p;
    });

    createNotification('payment', `Lançou pagamento de R$ ${input.amount} para o processo ${process.protocolNumber}`);
    persistData({ ...data, payments: [...data.payments, newPayment], processes: updatedProcesses });
  };

  const addAttachment = (targetId: string, category: 'client' | 'process' | 'payment' | 'delivery', fileData: string) => {
    if (!currentUser) return;
    const attachment: Attachment = {
      id: crypto.randomUUID(),
      url: fileData,
      type: 'image',
      description: `Captura por ${currentUser.name}`,
      category,
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };

    const newData = { ...data };
    if (category === 'client') {
      newData.clients = data.clients.map(c => c.id === targetId ? { ...c, attachments: [...c.attachments, attachment] } : c);
    } else {
      newData.processes = data.processes.map(p => p.id === targetId ? { ...p, attachments: [...p.attachments, attachment] } : p);
    }
    persistData(newData);
  };

  const clearNotifications = () => persistData({ ...data, notifications: [] });
  const markNotificationsRead = () => {
    const updated = data.notifications.map(n => ({ ...n, read: true }));
    persistData({ ...data, notifications: updated });
  };

  return (
    <AppContext.Provider value={{ 
      ...data, 
      users: MOCK_USERS, 
      currentUser, 
      isSynced,
      login, 
      logout, 
      addClient, 
      addProcess, 
      updateProcessStatus, 
      addPayment, 
      addAttachment,
      clearNotifications,
      markNotificationsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
