import { apiFetch, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';
import type { Page } from '@lib/api/page';

export const PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type Specialty = ResponseOf<'/api/admin/specialties/{id}', 'patch'>;
export type Unit = ResponseOf<'/api/admin/units/{id}', 'patch'>;
export type ExamType = ResponseOf<'/api/admin/exam-types/{id}', 'patch'>;
export type ExamOffer = ResponseOf<'/api/admin/units/{id}/exam-offers', 'get'>[number];
export type Policy = ResponseOf<'/api/admin/policy', 'get'>;
export type IntegrationClient = ResponseOf<'/api/admin/integration-clients', 'get'>['items'][number];

type WithActive<Body> = Body & { isActive: boolean };

interface CatalogCalls<Item, Values> {
  list: (query: { page: number; pageSize: number }, signal: AbortSignal) => Promise<Page<Item>>;
  create: (values: Values) => Promise<Item>;
  update: (id: string, values: Values) => Promise<Item>;
}

function catalogResource<Item, Values>(calls: CatalogCalls<Item, Values>) {
  return {
    list: (page: number, signal: AbortSignal, pageSize = PAGE_SIZE) => calls.list({ page, pageSize }, signal),
    save: (id: string | null, values: Values) =>
      id === null ? calls.create(values) : calls.update(id, values),
  };
}

export const specialtiesApi = catalogResource({
  list: (query, signal) => apiFetch('get', '/api/admin/specialties', { query, signal }),
  create: ({ isActive: _isActive, ...body }: WithActive<BodyOf<'/api/admin/specialties', 'post'>>) =>
    apiFetch('post', '/api/admin/specialties', { body }),
  update: (id, body) => apiFetch('patch', '/api/admin/specialties/{id}', { params: { id }, body }),
});
export const unitsApi = catalogResource({
  list: (query, signal) => apiFetch('get', '/api/admin/units', { query, signal }),
  create: ({ isActive: _isActive, ...body }: WithActive<BodyOf<'/api/admin/units', 'post'>>) =>
    apiFetch('post', '/api/admin/units', { body }),
  update: (id, body) => apiFetch('patch', '/api/admin/units/{id}', { params: { id }, body }),
});
export const examTypesApi = catalogResource({
  list: (query, signal) => apiFetch('get', '/api/admin/exam-types', { query, signal }),
  create: ({ isActive: _isActive, ...body }: WithActive<BodyOf<'/api/admin/exam-types', 'post'>>) =>
    apiFetch('post', '/api/admin/exam-types', { body }),
  update: (id, body) => apiFetch('patch', '/api/admin/exam-types/{id}', { params: { id }, body }),
});

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

export const integrationsApi = {
  list: (page: number, signal: AbortSignal) =>
    apiFetch('get', '/api/admin/integration-clients', { query: { page, pageSize: PAGE_SIZE }, signal }),
  create: (body: BodyOf<'/api/admin/integration-clients', 'post'>) =>
    apiFetch('post', '/api/admin/integration-clients', { body }),
  revoke: (id: string) => apiFetch('post', '/api/admin/integration-clients/{id}/revoke', { params: { id } }),
};
