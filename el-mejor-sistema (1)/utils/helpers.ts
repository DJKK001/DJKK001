
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const formatSimpleDate = (dateString: string) => {
  if (!dateString) return '-';
  // Use UTC to avoid timezone shifts on simple dates
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() + offset * 60 * 1000);
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(adjustedDate);
};

export const generateProtocol = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `DOC-${year}-${random}`;
};

export const calculateProcessFinancials = (total: number, payments: number) => {
  const balance = total - payments;
  let status = 'Não pago';
  if (payments === 0) status = 'Não pago';
  else if (balance <= 0) status = 'Quitado';
  else status = 'Parcialmente pago';
  
  return { balance: Math.max(0, balance), status };
};
