import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from './buttonStyles'

interface StyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant,
  size,
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return (
    <button
      className={buttonClasses(variant, size, className)}
      type={type}
      {...props}
    />
  )
}

export function ButtonLink({
  variant,
  size,
  className = '',
  ...props
}: LinkProps & StyleProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />
}
