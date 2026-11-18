import type { ComponentProps } from 'react';

export function SheetGrab(props: ComponentProps<'div'>) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Arraste para ajustar a altura"
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      className="bg-surface group/grab sticky top-0 z-10 flex h-[30px] flex-none cursor-grab touch-none items-center justify-center rounded-xl focus-visible:-outline-offset-4 in-data-dragging:cursor-grabbing"
      {...props}
    >
      <span
        aria-hidden
        className="bg-border-strong group-hover/grab:bg-text-muted group-focus-visible/grab:bg-text-muted in-data-dragging:bg-text-muted h-[5px] w-11 rounded-full transition-[scale,background-color] group-hover/grab:scale-x-[1.227] group-focus-visible/grab:scale-x-[1.227] in-data-dragging:scale-x-[1.227]"
      />
    </div>
  );
}
