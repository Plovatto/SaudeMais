import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { LuCake, LuLock } from 'react-icons/lu';
import { PersonalDataFields } from '@components/forms/PersonalDataFields';
import { Avatar, Button, Drawer, DrawerBody, DrawerFooter, FormAlert, Input, useToast } from '@components/ui';
import { areas, type Role } from '@constants/areas';
import { handleProtectedAccount } from '@lib/auth/protected-account';
import type { CurrentUser } from '@lib/auth/useSession';
import { queryKeys } from '@lib/query-keys';
import { useFormSubmit } from '@lib/useFormSubmit';
import { updateProfile } from './profile-api';
import {
  birthDateLimits,
  profileBody,
  profileSchema,
  profileValues,
  type ProfileValues,
} from './profile-schemas';

interface EditProfileFormProps {
  user: CurrentUser;
  role: Role;
  withBirthDate: boolean;
  onClose: () => void;
  onProtected: () => void;
}

function EditProfileForm({ user, role, withBirthDate, onClose, onProtected }: EditProfileFormProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: profileValues(user) });
  const { alert, run } = useFormSubmit(
    setError,
    ['fullName', 'phone', 'birthDate'],
    handleProtectedAccount(onProtected, onClose),
  );

  const onSubmit = handleSubmit((values) =>
    run(async () => {
      const updated = await updateProfile(profileBody(values, withBirthDate));
      queryClient.setQueryData(queryKeys.session, updated);
      onClose();
      show({ message: 'Dados atualizados.', tone: 'success' });
    }),
  );

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-1 flex-col">
      <DrawerBody>
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} seed={user.id} size="lg" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-text truncate text-sm font-semibold">{user.fullName}</p>
            <p className="text-text-secondary text-[0.8125rem]">{areas[role].label}</p>
          </div>
        </div>
        <PersonalDataFields
          fullName={register('fullName')}
          phone={register('phone')}
          errors={{ fullName: errors.fullName?.message, phone: errors.phone?.message }}
          locked={false}
          ownAccount
        />
        {withBirthDate && (
          <Input
            label="Data de nascimento"
            type="date"
            autoComplete="bday"
            icon={<LuCake />}
            hint="Opcional. Deixe em branco para remover."
            {...birthDateLimits()}
            error={errors.birthDate?.message}
            {...register('birthDate')}
          />
        )}
        <Input
          label="E-mail"
          type="email"
          value={user.email}
          readOnly
          end={<LuLock aria-hidden className="text-text-muted me-3.5 shrink-0" />}
          hint="Usado para entrar. Para trocar, fale com a administração."
        />
        {alert && <FormAlert>{alert}</FormAlert>}
      </DrawerBody>
      <DrawerFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Salvar alterações
        </Button>
      </DrawerFooter>
    </form>
  );
}

export interface EditProfileDrawerProps extends EditProfileFormProps {
  open: boolean;
}

export function EditProfileDrawer({ open, ...props }: EditProfileDrawerProps) {
  return (
    <Drawer open={open} onClose={props.onClose} title="Editar perfil">
      {open && <EditProfileForm {...props} />}
    </Drawer>
  );
}
