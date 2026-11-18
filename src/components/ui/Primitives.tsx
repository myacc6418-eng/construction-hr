import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  X,
  XCircle,
} from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] border border-transparent shadow-xs',
      secondary: 'bg-[#101F35] text-white hover:bg-[#1A3152] border border-transparent shadow-xs',
      outline: 'bg-white text-[#172B4D] border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
      ghost: 'bg-transparent text-[#64748B] hover:text-[#172B4D] hover:bg-slate-100 border border-transparent',
      danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] border border-transparent shadow-xs',
      success: 'bg-[#16A34A] text-white hover:bg-[#15803D] border border-transparent shadow-xs',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-10 px-5 text-sm gap-2',
      icon: 'h-9 w-9 p-0 justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn('bg-white border border-slate-200/90 rounded-lg', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3', className)} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);

export type SemanticTone = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

const TONE_STYLES: Record<SemanticTone, { box: string; icon: React.ReactNode }> = {
  success: {
    box: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
  },
  warning: {
    box: 'bg-amber-50 text-[#B45309] border-amber-200',
    icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
  },
  danger: {
    box: 'bg-red-50 text-[#DC2626] border-red-200',
    icon: <XCircle className="w-3.5 h-3.5 shrink-0" />,
  },
  info: {
    box: 'bg-blue-50 text-[#2563EB] border-blue-200',
    icon: <Info className="w-3.5 h-3.5 shrink-0" />,
  },
  purple: {
    box: 'bg-violet-50 text-[#7C3AED] border-violet-200',
    icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
  },
  neutral: {
    box: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
  },
};

export function inferStatusTone(status: string): SemanticTone {
  const s = status.toLowerCase();
  if (
    s.includes('active') ||
    s.includes('confirmed') ||
    s.includes('present') ||
    s.includes('verified') ||
    s.includes('approved') ||
    s.includes('resolved') ||
    s.includes('compliant') ||
    s.includes('completed') ||
    s.includes('closed')
  ) {
    if (s.includes('non-compliant') || s.includes('inactive')) return 'danger';
    return 'success';
  }
  if (
    s.includes('overdue') ||
    s.includes('expired') ||
    s.includes('rejected') ||
    s.includes('terminated') ||
    s.includes('critical') ||
    s.includes('missing') ||
    s.includes('flagged') ||
    s.includes('non-compliant') ||
    s.includes('suspended') ||
    s.includes('resubmission')
  ) {
    return 'danger';
  }
  if (
    s.includes('pending') ||
    s.includes('expiring') ||
    s.includes('probation') ||
    s.includes('notice') ||
    s.includes('late') ||
    s.includes('review') ||
    s.includes('clarification') ||
    s.includes('gaps') ||
    s.includes('exception') ||
    s.includes('high') ||
    s.includes('awaiting')
  ) {
    return 'warning';
  }
  if (s.includes('escalated') || s.includes('forwarded') || s.includes('onboarding') || s.includes('leave')) {
    return 'purple';
  }
  if (s.includes('uploaded') || s.includes('progress') || s.includes('assigned') || s.includes('submitted')) {
    return 'info';
  }
  return 'neutral';
}

export const StatusBadge: React.FC<{
  label: string;
  tone?: SemanticTone;
  showIcon?: boolean;
  className?: string;
}> = ({ label, tone, showIcon = true, className }) => {
  const resolved = tone ?? inferStatusTone(label);
  const style = TONE_STYLES[resolved];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0',
        style.box,
        className
      )}
    >
      {showIcon && style.icon}
      <span>{label}</span>
    </span>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-[#172B4D] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] disabled:bg-slate-50 disabled:text-slate-400',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] disabled:bg-slate-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-[#172B4D] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB]',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Avatar: React.FC<{
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ name, src, size = 'md' }) => {
  const [imgError, setImgError] = React.useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const sizeClass = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-16 h-16 text-lg',
  }[size];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={cn('rounded-lg object-cover border border-slate-200 shrink-0', sizeClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-[#101F35] text-white font-semibold flex items-center justify-center shrink-0 select-none',
        sizeClass
      )}
    >
      {initials || 'BF'}
    </div>
  );
};

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, maxWidth = 'lg', children }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101F35]/50 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn('w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-[90vh] flex flex-col', widthClass)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#172B4D] truncate">{title}</h2>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="py-12 px-6 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 mb-3">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-[#172B4D]">{title}</h3>
    <p className="text-xs text-[#64748B] max-w-md mt-1">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} size="sm" className="mt-4">
        {actionLabel}
      </Button>
    )}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2 p-4">
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="h-10 bg-slate-100 rounded animate-pulse" />
    ))}
  </div>
);

export const AccessRestrictedBanner: React.FC<{
  title?: string;
  message: string;
}> = ({ title = 'Access Restricted by Role Policy', message }) => (
  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/70 flex items-start gap-3">
    <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-semibold text-[#172B4D]">{title}</p>
      <p className="text-xs text-[#64748B] mt-0.5">{message}</p>
    </div>
  </div>
);
