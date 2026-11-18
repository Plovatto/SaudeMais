import { Avatar, ListRow } from '@components/ui';
import { cx } from '@lib/cx';
import { RoleChips, StatusBadge } from './UserBadges';
import type { AdminUser } from './users-api';

export interface UserRowProps {
  user: AdminUser;
  isSelf: boolean;
  onOpen: (user: AdminUser) => void;
}

export function UserRow({ user, isSelf, onOpen }: UserRowProps) {
  const inactive = user.deactivatedAt !== null;
  return (
    <ListRow
      onClick={() => onOpen(user)}
      aria-haspopup="dialog"
      className="cursor-pointer"
      leading={<Avatar name={user.fullName} seed={user.id} className={cx(inactive && 'opacity-60')} />}
      title={user.fullName}
      meta={isSelf ? `Você · ${user.email}` : user.email}
      trailing={
        <>
          <RoleChips roles={user.roles} className="shrink-0 max-lg:hidden" />
          <StatusBadge inactive={inactive} />
        </>
      }
    />
  );
}
