import { LuUserX } from 'react-icons/lu';
import { Link, Navigate } from 'react-router';
import { RoleLogo } from '@components/layout/RoleLogo';
import { Chevron, EmptyState, stagger } from '@components/ui';
import { hitArea, textLink } from '@components/ui/styles';
import { areas } from '@constants/areas';
import { useCurrentUser } from '@lib/auth/useSession';
import { useSignOut } from '@lib/auth/useSignOut';
import { cx } from '@lib/cx';
import { firstName } from '@lib/initials';
import { plural } from '@lib/plural';
import { AuthFooter } from './AuthFooterLink';
import { AuthScreen } from './AuthScreen';

export function RoleSelectPage() {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const choices = Object.values(areas).filter((area) => user.roles.includes(area.role));
  const [only] = choices;
  if (choices.length === 1 && only) return <Navigate to={only.base} replace />;
  const count = choices.length ? ` Sua conta tem ${plural(choices.length, 'perfil', 'perfis')}.` : '';
  const greeting = `Olá, ${firstName(user.fullName)}!${count}`;

  return (
    <AuthScreen
      art={{
        title: 'Um acesso, vários perfis.',
        text: 'Escolha como quer usar o Saúde+. Você pode trocar de perfil quando quiser.',
      }}
      title="Escolha seu perfil"
      subtitle={greeting}
    >
      {choices.length === 0 ? (
        <EmptyState
          icon={<LuUserX />}
          title="Nenhum perfil ativo"
          description="Sua conta ainda não tem um perfil liberado. Fale com a administração da clínica."
        />
      ) : (
        <ul aria-label="Perfis da conta" className="flex flex-col gap-3">
          {choices.map((area, index) => (
            <li key={area.role} data-role={area.role} className={stagger(index)}>
              <Link
                to={area.base}
                className="group rounded-card border-border bg-surface shadow-card can-hover:-translate-y-px can-hover:border-role-strong can-hover:shadow-[0_0_0_3px_color-mix(in_oklab,var(--role-strong)_18%,transparent),0_10px_22px_-12px_rgb(16_42_41/0.3)] flex items-center gap-3.5 border p-4 transition-[border-color,box-shadow,translate] duration-150"
              >
                <RoleLogo area={area} className="size-12 rounded-[14px]" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-text text-base font-[650]">{area.label}</span>
                  <span className="text-text-secondary text-[0.8125rem]">{area.description}</span>
                </span>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <AuthFooter>
        <button
          type="button"
          onClick={() => void signOut()}
          aria-describedby="role-select-back-hint"
          className={cx(hitArea, textLink)}
        >
          Entrar com outra conta
        </button>
        <span id="role-select-back-hint" className="sr-only">
          Encerra a sessão e volta para o login.
        </span>
      </AuthFooter>
    </AuthScreen>
  );
}
