
export enum UserRole {
  ADMIN = 'Administrador',
  OPERATOR = 'Operador',
  FINANCIAL = 'Financeiro',
  QUERY = 'Consulta'
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  userName: string;
  type: 'process' | 'payment' | 'client';
  message: string;
  timestamp: string;
  read: boolean;
}

export enum ProcessStatus {
  ELABORATION = 'Em elaboração',
  TRANSIT = 'Em trâmite',
  READY = 'Pronto',
  DELIVERED = 'Entregue'
}

export enum PaymentStatus {
  UNPAID = 'Não pago',
  PARTIAL = 'Parcialmente pago',
  PAID = 'Quitado'
}

export enum PaymentMethod {
  PIX = 'PIX',
  CASH = 'Dinheiro',
  CREDIT_CARD = 'Cartão de Crédito',
  DEBIT_CARD = 'Cartão de Débito',
  BOLETO = 'Boleto'
}

export enum ServiceChannel {
  PRESENTIAL = 'Presencial',
  WHATSAPP = 'WhatsApp'
}

export interface Attachment {
  id: string;
  url: string;
  type: 'image' | 'pdf';
  description: string;
  category: 'client' | 'process' | 'payment' | 'delivery';
  createdAt: string;
  userId: string;
  aiAnalysis?: string;
}

export interface Client {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone: string;
  address: string;
  birthDate?: string;
  attachments: Attachment[];
  createdAt: string;
  createdBy: string;
}

export interface Payment {
  id: string;
  processId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  proofUrl?: string;
  createdBy: string;
}

export interface Process {
  id: string;
  clientId: string;
  protocolNumber: string;
  documentType: string;
  status: ProcessStatus;
  channel: ServiceChannel;
  totalValue: number;
  paidValue: number;
  openBalance: number;
  financialStatus: PaymentStatus;
  createdAt: string;
  readyAt?: string;
  deliveredAt?: string;
  deliveredBy?: string;
  responsibleId: string;
  observations?: string;
  attachments: Attachment[];
  history: ProcessHistoryItem[];
  createdBy: string;
}

export interface ProcessHistoryItem {
  id: string;
  date: string;
  action: string;
  userId: string;
  details: string;
}

export interface AppState {
  clients: Client[];
  processes: Process[];
  payments: Payment[];
  notifications: AppNotification[];
  users: User[];
  currentUser: User | null;
  isSynced: boolean;
}
