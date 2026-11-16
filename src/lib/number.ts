const count = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

export const formatCount = (value: number) => count.format(value);

export const formatDecimal = (value: number) => decimal.format(value);

export const formatPercent = (value: number) => percent.format(value);
