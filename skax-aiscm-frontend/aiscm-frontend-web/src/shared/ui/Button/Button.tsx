"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Icon, { type IconName } from "@/shared/ui/Icon/IconSvg";
import styles from "./Button.module.css";

/**
 * Figma 4 variant + `disabled` 조합(5번째 = 비활성 스킨)
 * - primary, assistive, assistiveDanger, submit
 */
export type Variant = "solid" | "outlined";
export type Color = "primary" | "assistive" | "danger" | "submit";
export type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  color?: Color;
  size?: Size;
  icon?: IconName;
  iconRight?: boolean;
  iconOnly?: boolean;
  round?: boolean;
}

const dataVariant: Record<Variant, string> = {
  solid: "solid",
  outlined: "outlined",
};

const dataColor: Record<Color, string> = {
  primary: "primary",
  assistive: "assistive",
  danger: "danger",
  submit: "submit",
};

const dataSize: Record<Size, string> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

/**
 * figma-handoff: Primary, Assistive, Assistive danger, Submit, Disabled(= disabled 속성)
 */
export default function Button({
  children,
  type = "button",
  className = "",
  variant = "solid",
  color = "primary",
  size = "md",
  icon,
  iconRight,
  iconOnly,
  round,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      // className={`${styles.root} ${styles[dataVariant[variant]]} ${styles[dataColor[color]]} ${styles[dataSize[size]]} ${iconRight ? styles.iconRight : ""} ${iconOnly ? styles.iconOnly : ""} ${className}`.trim()}
      className={[
        styles.root,
        styles[dataVariant[variant]],
        styles[dataColor[color]],
        styles[dataSize[size]],
        iconRight && styles.iconRight,
        iconOnly && styles.iconOnly,
        round && styles.round,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-variant={dataVariant[variant] ?? "solid"}
      data-color={dataColor[color] ?? "assistive"}
      data-size={dataSize[size] ?? "md"}
      disabled={disabled}
      {...rest}
    >
      {icon && (!iconRight || iconOnly) ? <Icon iconName={icon} className={styles.icon} /> : null}
      <span className={styles.textLabel}>{children}</span>
      {icon && iconRight ? <Icon iconName={icon} className={styles.icon} /> : null}
    </button>
  );
}
