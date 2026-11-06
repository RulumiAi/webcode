import type { ComponentPropsWithoutRef } from 'react';

type BrandLogoProps = Omit<ComponentPropsWithoutRef<'img'>, 'alt' | 'src'> & {
  alt?: string;
};

export const BrandLogo = ({ alt = '', className, ...props }: BrandLogoProps) => (
  <img
    src="/brand/mio.svg"
    alt={alt}
    className={`block object-contain ${className || ''}`}
    draggable={false}
    {...props}
  />
);
