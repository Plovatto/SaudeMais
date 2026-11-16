import { randomUUID } from 'node:crypto';

export interface Person {
  fullName: string;
  email: string;
  password: string;
}

export function newPerson(role: string): Person {
  const id = randomUUID().slice(0, 8);
  return {
    fullName: `${role} Teste ${id}`,
    email: `e2e-${id}@saudemais.test`,
    password: `senha-e2e-${randomUUID()}`,
  };
}
