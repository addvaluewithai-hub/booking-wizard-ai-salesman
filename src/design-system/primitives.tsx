import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { CheckIcon, XIcon } from './icons';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('ds-button', `ds-button--${variant}`, `ds-button--${size}`, className)}
      {...props}
    >
      {leadingIcon ? <span className="ds-button__icon">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="ds-button__icon">{trailingIcon}</span> : null}
    </button>
  );
});

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('ds-icon-button', className)}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
});

export type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'base' | 'raised' | 'soft';
  padding?: 'sm' | 'md' | 'lg';
};

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { tone = 'base', padding = 'md', className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('ds-surface', `ds-surface--${tone}`, `ds-surface--${padding}`, className)}
      {...props}
    />
  );
});

export type ChoiceCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
  description?: string;
  selected?: boolean;
  meta?: ReactNode;
};

export const ChoiceCard = forwardRef<HTMLButtonElement, ChoiceCardProps>(function ChoiceCard(
  { title, description, selected = false, meta, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('ds-choice-card', selected && 'is-selected', className)}
      aria-pressed={selected}
      {...props}
    >
      <span className="ds-choice-card__copy">
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </span>
      {meta ? <span className="ds-choice-card__meta">{meta}</span> : null}
      <span className="ds-choice-card__check" aria-hidden="true">
        <CheckIcon size={16} />
      </span>
    </button>
  );
});

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('ds-chip', selected && 'is-selected', className)}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </button>
  );
});

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <label className="ds-field" htmlFor={inputId}>
      <span className="ds-field__label">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={cx('ds-field__input', error && 'is-invalid', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {hint ? <span id={hintId} className="ds-field__hint">{hint}</span> : null}
      {error ? <span id={errorId} className="ds-field__error">{error}</span> : null}
    </label>
  );
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'success';
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cx('ds-badge', `ds-badge--${tone}`, className)} {...props} />;
}

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string;
  height?: string;
};

export function Skeleton({ width, height, className, style, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('ds-skeleton', className)}
      style={{ ...style, width, height }}
      {...props}
    />
  );
}

export type SheetProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function Sheet({ open, title, description, onClose, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const panel = panelRef.current;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])
      .filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    const initial = getFocusable()[0] ?? panel;
    initial?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ds-sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="ds-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <div className="ds-sheet__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <IconButton label="Close" icon={<XIcon />} onClick={onClose} />
        </div>
        <div className="ds-sheet__body">{children}</div>
        {footer ? <div className="ds-sheet__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
