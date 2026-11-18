const count = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export const formatCount = (value: number) => count.format(value);

export const formatPercent = (value: number) => percent.format(value);

const measurement = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 20 });

export const formatMeasurement = (value: number) => measurement.format(value);

const hours = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatHours = (minutes: number) => `${hours.format(minutes / 60)} h`;

const points = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatPoints = (value: number) => `${points.format(value)} p.p.`;
