import { useRef, useState, type RefObject } from 'react';
import { Drawer, DrawerBody, QueryError, Skeleton } from '@components/ui';
import { DOCTOR_SECTION, NEW_USER, USER_PARAM, USER_SECTION_PARAM } from '@constants/admin-users';
import { useSearchParam, useSetSearchParams } from '@hooks/useSearchParam';
import { CreateUserForm } from './CreateUserForm';
import { DoctorProfileForm } from './DoctorProfileForm';
import { userMessages } from './user-messages';
import { UserEditor } from './UserEditor';
import { useProfileRemoval } from './useProfileRemoval';
import { useUserActions } from './useUserActions';
import { useUserDetail } from './useUserDetail';

export interface UserPanelProps {
  fallbackFocus: RefObject<HTMLElement | null>;
}

export function UserPanel({ fallbackFocus }: UserPanelProps) {
  const setParams = useSetSearchParams();
  const [userParam] = useSearchParam(USER_PARAM);
  const [section, setSection] = useSearchParam(USER_SECTION_PARAM);
  const creating = userParam === NEW_USER;
  const userId = creating ? '' : userParam;
  const { query, locks } = useUserDetail(userId);
  const actions = useUserActions(fallbackFocus);
  const doctorButton = useRef<HTMLButtonElement>(null);
  const backToUser = () => setSection('', { replace: true });
  const removal = useProfileRemoval(doctorButton, backToUser);
  const [lastSection, setLastSection] = useState(section);
  const [backFromDoctor, setBackFromDoctor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  if (lastSection !== section) {
    setLastSection(section);
    setBackFromDoctor(lastSection === DOCTOR_SECTION);
  }

  const user = query.data;
  const doctor = section === DOCTOR_SECTION;
  const close = () => setParams({ [USER_PARAM]: '', [USER_SECTION_PARAM]: '' }, { replace: true });
  const title = creating
    ? 'Novo usuário'
    : doctor
      ? user?.doctorProfile
        ? 'Perfil de médico'
        : 'Tornar médico'
      : 'Editar usuário';

  return (
    <>
      <Drawer
        side
        open={userParam !== ''}
        onClose={close}
        title={title}
        dismissible={!submitting}
        fallbackFocus={fallbackFocus}
      >
        {creating && <CreateUserForm onClose={close} onSubmittingChange={setSubmitting} />}
        {userId !== '' && query.isPending && (
          <DrawerBody>
            <div aria-busy="true" className="flex flex-col gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-56" />
            </div>
          </DrawerBody>
        )}
        {userId !== '' && query.isError && (
          <DrawerBody>
            <QueryError error={query.error} messages={userMessages} onRetry={() => void query.refetch()} />
          </DrawerBody>
        )}
        {userId !== '' &&
          user &&
          locks &&
          (doctor ? (
            <DoctorProfileForm
              key={user.id}
              user={user}
              locked={locks.isInactive}
              onBack={backToUser}
              onRemove={() => removal.request(user)}
              onSubmittingChange={setSubmitting}
            />
          ) : (
            <UserEditor
              key={user.id}
              user={user}
              locks={locks}
              actions={actions}
              doctorButton={doctorButton}
              focusDoctor={backFromDoctor}
              onDoctor={() => setSection(DOCTOR_SECTION)}
              onClose={close}
              onSubmittingChange={setSubmitting}
            />
          ))}
      </Drawer>
      {actions.dialogs}
      {removal.dialog}
    </>
  );
}
