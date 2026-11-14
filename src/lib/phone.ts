export function formatPhone(value: string): string {
  const national = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(value);
  return national ? `(${national[1]}) ${national[2]}-${national[3]}` : value;
}
