import React, { type ComponentProps, useEffect, useState } from 'react';
import { CreateCharacterModal } from './CreateCharacterModal';

type CreateCharacterSurfaceProps = Omit<ComponentProps<typeof CreateCharacterModal>, 'isOpen' | 'presentation'> & {
  breakpoint?: number;
};

const isMobileViewport = (breakpoint: number) => (
  typeof window !== 'undefined'
  && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
);

export function CreateCharacterSurface({ breakpoint = 1024, ...props }: CreateCharacterSurfaceProps) {
  const [isMobile, setIsMobile] = useState(() => isMobileViewport(breakpoint));

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [breakpoint]);

  return (
    <div className={isMobile ? 'mobile-route-page h-full' : 'create-workspace-page h-full min-h-0'}>
      <CreateCharacterModal {...props} isOpen presentation={isMobile ? 'page' : 'workspace'} />
    </div>
  );
}