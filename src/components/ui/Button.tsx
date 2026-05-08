import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variantClasses = {
  primary:   'bg-brand-blue text-white active:brightness-90',
  secondary: 'bg-brand-bg text-brand-blue border border-brand-blue/20 active:bg-brand-blue/10',
  ghost:     'bg-transparent text-brand-muted active:bg-gray-100',
  danger:    'bg-red-500 text-white active:brightness-90',
}

const sizeClasses = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-5 py-3 text-base rounded-2xl',
  lg: 'px-6 py-4 text-lg rounded-2xl',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        font-semibold transition-all duration-150
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

// カテゴリ選択ボタン
interface CategoryButtonProps {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
  color?: string
}

export function CategoryButton({ emoji, label, selected, onClick, color = '#4F6DF5' }: CategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-1
        p-3 rounded-2xl border-2 transition-all duration-150
        active:scale-95 min-h-[72px] w-full
        ${selected
          ? 'border-transparent text-white shadow-card'
          : 'border-gray-100 bg-white text-brand-text'}
      `}
      style={selected ? { backgroundColor: color } : {}}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="text-xs font-medium leading-none">{label}</span>
    </button>
  )
}
