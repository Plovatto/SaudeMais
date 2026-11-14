import { DoctorProfileForm } from './DoctorProfileForm';
import { ADMIN_USERS_PATH } from './user-cache';
import { UserDetailGate } from './UserDetailGate';

export function DoctorProfilePage() {
  return (
    <UserDetailGate title="Cadastro de médico" backFallback={(id) => `${ADMIN_USERS_PATH}/${id}`}>
      {(user, locks) => (
        <DoctorProfileForm key={user.id} user={user} locked={locks.isProtected || locks.isInactive} />
      )}
    </UserDetailGate>
  );
}
