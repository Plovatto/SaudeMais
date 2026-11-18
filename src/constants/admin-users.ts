import { areas } from './areas';

export const ADMIN_USERS_PATH = `${areas.admin.base}/usuarios`;

export const USER_PARAM = 'usuario';

export const USER_SECTION_PARAM = 'secao';

export const NEW_USER = 'novo';

export const DOCTOR_SECTION = 'medico';

export const adminUserUrl = (id: string, section?: typeof DOCTOR_SECTION) =>
  `${ADMIN_USERS_PATH}?${new URLSearchParams({ [USER_PARAM]: id, ...(section && { [USER_SECTION_PARAM]: section }) }).toString()}`;
