const count = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export const formatCount = (value: number) => count.format(value);

export const formatPercent = (value: number) => percent.format(value);

const measurement = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 20 });

export const formatMeasurement = (value: number) => measurement.format(value);

const oneDecimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatHours = (minutes: number) => `${oneDecimal.format(minutes / 60)} h`;

export const formatPoints = (value: number) => `${oneDecimal.format(value)} p.p.`;
