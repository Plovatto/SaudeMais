const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} to run the end-to-end tests`);
  return value;
};

export const API_URL = process.env.VITE_API_URL ?? 'http://localhost:3001';

export const WEB_ORIGIN = 'http://localhost:4173';

export const admin = () => ({ email: required('ADMIN_EMAIL'), password: required('ADMIN_PASSWORD') });
