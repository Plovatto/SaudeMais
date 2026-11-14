import { Link } from 'react-router';
import { Menu, type MenuItem } from '@components/ui';
import { cx } from '@lib/cx';
import { ADMIN_USERS_PATH, type UserLocks } from './user-cache';
import { UserAvatar, UserBadges } from './UserBadges';
import type { AdminUser } from './users-api';

export interface UserRowProps {
  user: AdminUser;
  locks: UserLocks;
  actions: MenuItem[];
}

const cell = 'lg:border-border lg:table-cell lg:border-t lg:px-4 lg:py-3 lg:align-middle';

export function UserRow({ user, locks, actions }: UserRowProps) {
  return (
    <tr
      role="row"
      className="rounded-tile border-border bg-surface flex flex-wrap items-center gap-x-3 gap-y-2 border p-4 lg:table-row lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
    >
      <td role="cell" className={cx('min-w-0 basis-[calc(100%-3.75rem)]', cell)}>
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar roles={user.roles} />
          <div className="flex min-w-0 flex-col">
            <Link
              to={`${ADMIN_USERS_PATH}/${user.id}`}
              className="text-text can-hover:underline truncate font-semibold"
            >
              {user.fullName}
            </Link>
            <span className="text-text-secondary truncate text-sm">{user.email}</span>
          </div>
        </div>
      </td>
      <td role="cell" className={cx('order-last basis-full ps-15 lg:order-none', cell)}>
        <UserBadges roles={user.roles} locks={locks} />
      </td>
      <td role="cell" className={cx('ms-auto lg:w-0 lg:text-end', cell)}>
        <Menu label={`Ações para ${user.fullName}`} items={actions} />
      </td>
    </tr>
  );
}
