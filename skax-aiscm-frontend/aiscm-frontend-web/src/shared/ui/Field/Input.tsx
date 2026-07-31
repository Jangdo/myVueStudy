"use client";

import { forwardRef, useState, } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, } from "react";
import styles from "./Input.module.css";

type Size = "sm" | "md" | "lg";

type InputActionProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
  };

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "onChange"
> & {
  value?: string;
  size?: Size;
  clearable?: boolean;
  action?: ReactNode;
  onChange?: (
    value: string
  ) => void;
};

function InputAction({
  children,
  className = "",
  ...rest
}: InputActionProps) {
  return (
    <button
      type="button"
      className={[
        styles.actionButton,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

const Input = forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      type = "text",
      value,
      defaultValue = "",
      disabled = false,
      placeholder,
      clearable = false,
      action,
      size = "md",
      className = "",
      onChange,
      ...rest
    },
    ref
  ) => {
    const [internalValue, setInternalValue] =
      useState(
        String(defaultValue)
      );

    const isControlled =
      value !== undefined;

    const currentValue =
      isControlled
        ? value
        : internalValue;

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const nextValue =
        e.target.value;

      if (!isControlled) {
        setInternalValue(
          nextValue
        );
      }

      onChange?.(nextValue);
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue("");
      }

      onChange?.("");
    };

    return (
      <div
        className={[
          styles.wrapper,
          styles[`size-${size}`],
          disabled && styles.disabled,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          ref={ref}
          type={type}
          value={currentValue}
          disabled={disabled}
          placeholder={
            placeholder
          }
          className={styles.input}
          onChange={
            handleChange
          }
          {...rest}
        />

        {/* clear button */}
        {clearable &&
        currentValue &&
        !disabled ? (
          <button
            type="button"
            className={
              styles.clear
            }
            onClick={
              handleClear
            }
          >
            ✕
          </button>
        ) : null}

        {/* action slot */}
        {action ? (
          <div
            className={
              styles.action
            }
          >
            {action}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export {
  Input,
  InputAction,
};

export type {
  InputProps,
};