export const MAIN_ID = 'conteudo';

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_ID}`}
      className="rounded-field bg-surface text-role-text shadow-card sr-only px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
    >
      Pular para o conteúdo
    </a>
  );
}
