import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  title?: string;
};

function iconA11y(title?: string) {
  return title
    ? { role: 'img' as const, 'aria-label': title }
    : { 'aria-hidden': true as const };
}

export function SparkIcon({ size = 20, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...iconA11y(title)} {...props}>
      <path d="M12 2.8c.55 4.66 2.54 6.65 7.2 7.2-4.66.55-6.65 2.54-7.2 7.2-.55-4.66-2.54-6.65-7.2-7.2 4.66-.55 6.65-2.54 7.2-7.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M18.6 15.5c.23 1.96 1.08 2.8 3.04 3.04-1.96.23-2.8 1.08-3.04 3.04-.23-1.96-1.08-2.8-3.04-3.04 1.96-.23 2.8-1.08 3.04-3.04Z" fill="currentColor" />
    </svg>
  );
}

export function ArrowUpRightIcon({ size = 20, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...iconA11y(title)} {...props}>
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...iconA11y(title)} {...props}>
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 20, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...iconA11y(title)} {...props}>
      <path d="m5.5 12.4 4 4L18.8 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XIcon({ size = 20, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...iconA11y(title)} {...props}>
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
