const browsers: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const systems: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
];

const match = (value: string, patterns: [RegExp, string][]) =>
  patterns.find(([pattern]) => pattern.test(value))?.[1];

export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Dispositivo desconhecido';
  const browser = match(userAgent, browsers);
  const system = match(userAgent, systems);
  if (browser && system) return `${browser} no ${system}`;
  return browser ?? system ?? 'Dispositivo desconhecido';
}
