export type ButtonVariant =
  'primary' | 'secondary' | 'gold' | 'danger' | 'ghost'
export type ButtonSize = 'md' | 'lg'

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra = '',
): string {
  return ['btn', `btn-${variant}`, size === 'lg' ? 'btn-lg' : '', extra]
    .filter(Boolean)
    .join(' ')
}
