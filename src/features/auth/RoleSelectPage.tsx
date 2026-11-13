import { LuChevronLeft } from 'react-icons/lu';
import { Link, Navigate } from 'react-router';
import { Button, IconSlot } from '@components/ui';
import { areas } from '@constants/areas';
import { useCurrentUser } from '@lib/auth/useSession';
import { useSignOut } from '@lib/auth/useSignOut';
import { AuthScreen } from './AuthScreen';

export function RoleSelectPage() {
  const user = useCurrentUser();
  const signOut = useSignOut();
  const choices = Object.values(areas).filter((area) => user.roles.includes(area.role));
  const [only] = choices;
  if (choices.length === 1 && only) return <Navigate to={only.base} replace />;

  return (
    <AuthScreen
      title="Escolha seu perfil"
      subtitle="Como você gostaria de acessar o sistema?"
      footer={
        <Button
          variant="secondary"
          icon={<LuChevronLeft />}
          onClick={() => void signOut()}
          className="mx-auto rounded-full border-transparent px-8"
        >
          Voltar
        </Button>
      }
    >
      <ul className="flex flex-col gap-5">
        {choices.map((area) => (
          <li key={area.role} data-role={area.role}>
            <Link
              to={area.base}
              className="rounded-tile border-border-field bg-surface can-hover:border-role-strong can-hover:bg-role-soft flex min-h-24 items-center gap-4 border px-5 py-4 transition-colors"
            >
              <IconSlot className="bg-role text-on-role rounded-tile size-12 justify-center text-[1.75rem]">
                <area.icon />
              </IconSlot>
              <span className="flex flex-col gap-1">
                <span className="text-text text-lg font-semibold">{area.label}</span>
                <span className="text-text-secondary text-sm">{area.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AuthScreen>
  );
}
