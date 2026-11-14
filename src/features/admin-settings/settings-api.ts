import { apiFetch, type ApiFetchOptions, type BodyOf, type ResponseOf } from '@lib/api/api-fetch';

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

interface CatalogTypes {
  '/api/admin/specialties': {
    item: Specialty;
    create: BodyOf<'/api/admin/specialties', 'post'>;
    update: BodyOf<'/api/admin/specialties/{id}', 'patch'>;
  };
  '/api/admin/units': {
    item: Unit;
    create: BodyOf<'/api/admin/units', 'post'>;
    update: BodyOf<'/api/admin/units/{id}', 'patch'>;
  };
  '/api/admin/exam-types': {
    item: ExamType;
    create: BodyOf<'/api/admin/exam-types', 'post'>;
    update: BodyOf<'/api/admin/exam-types/{id}', 'patch'>;
  };
}

const send = apiFetch as unknown as <T>(
  method: 'get' | 'post' | 'patch',
  path: string,
  options: ApiFetchOptions<unknown>,
) => Promise<T>;

function catalogResource<L extends keyof CatalogTypes>(listPath: L) {
  type Types = CatalogTypes[L];
  return {
    list: (page: number, signal: AbortSignal, pageSize = PAGE_SIZE) =>
      send<Page<Types['item']>>('get', listPath, { query: { page, pageSize }, signal }),
    create: (body: Types['create']) => send<Types['item']>('post', listPath, { body }),
    update: (id: string, body: Types['update']) =>
      send<Types['item']>('patch', `${listPath}/{id}`, { params: { id }, body }),
  };
}

export const specialtiesApi = catalogResource('/api/admin/specialties');
export const unitsApi = catalogResource('/api/admin/units');
export const examTypesApi = catalogResource('/api/admin/exam-types');

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
