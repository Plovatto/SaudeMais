import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';

export const PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type Specialty = ResponseOf<'/api/admin/specialties/{id}', 'patch'>;
export type Unit = ResponseOf<'/api/admin/units/{id}', 'patch'>;
export type ExamType = ResponseOf<'/api/admin/exam-types/{id}', 'patch'>;
export type ExamOffer = ResponseOf<'/api/admin/units/{id}/exam-offers', 'get'>[number];
export type Policy = ResponseOf<'/api/admin/policy', 'get'>;

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

const pageQuery = (page: number, pageSize: number) => ({ page, pageSize });

export const specialtiesApi = {
  list: (page: number, signal: AbortSignal, pageSize = PAGE_SIZE) =>
    apiFetch('get', '/api/admin/specialties', { query: pageQuery(page, pageSize), signal }),
  create: (body: BodyOf<'/api/admin/specialties', 'post'>) =>
    apiFetch('post', '/api/admin/specialties', { body }),
  update: (id: string, body: BodyOf<'/api/admin/specialties/{id}', 'patch'>) =>
    apiFetch('patch', '/api/admin/specialties/{id}', { params: { id }, body }),
};

export const unitsApi = {
  list: (page: number, signal: AbortSignal, pageSize = PAGE_SIZE) =>
    apiFetch('get', '/api/admin/units', { query: pageQuery(page, pageSize), signal }),
  create: (body: BodyOf<'/api/admin/units', 'post'>) => apiFetch('post', '/api/admin/units', { body }),
  update: (id: string, body: BodyOf<'/api/admin/units/{id}', 'patch'>) =>
    apiFetch('patch', '/api/admin/units/{id}', { params: { id }, body }),
};

export const examTypesApi = {
  list: (page: number, signal: AbortSignal, pageSize = PAGE_SIZE) =>
    apiFetch('get', '/api/admin/exam-types', { query: pageQuery(page, pageSize), signal }),
  create: (body: BodyOf<'/api/admin/exam-types', 'post'>) =>
    apiFetch('post', '/api/admin/exam-types', { body }),
  update: (id: string, body: BodyOf<'/api/admin/exam-types/{id}', 'patch'>) =>
    apiFetch('patch', '/api/admin/exam-types/{id}', { params: { id }, body }),
};

export const offersApi = {
  list: (unitId: string, signal: AbortSignal) =>
    apiFetch('get', '/api/admin/units/{id}/exam-offers', { params: { id: unitId }, signal }),
  save: (
    unitId: string,
    examTypeId: string,
    body: BodyOf<'/api/admin/units/{id}/exam-offers/{examTypeId}', 'put'>,
  ) =>
    apiFetch('put', '/api/admin/units/{id}/exam-offers/{examTypeId}', {
      params: { id: unitId, examTypeId },
      body,
    }),
};

export const policyApi = {
  get: (signal: AbortSignal) => apiFetch('get', '/api/admin/policy', { signal }),
  update: (body: BodyOf<'/api/admin/policy', 'put'>) => apiFetch('put', '/api/admin/policy', { body }),
};
