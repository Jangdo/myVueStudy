"use client";

import React from "react";
import styles from "./Field.module.css";

type Size = "sm" | "md" | "lg";

type FieldProps = {
  label?: string;
  htmlFor?: string
  required?: boolean;
  error?: string;
  helperText?: string;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export default function Field({
  label,
  htmlFor,
  required = false,
  error,
  helperText,
  size = "md",
  className = "",
  children,
}: FieldProps) {
  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ size?: Size }>, { size })
    : children;

  return (
    <div
      className={[
        styles.field,
        styles[`size-${size}`],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label ? (
        <label
          htmlFor={htmlFor}
          className={[
            styles.label,
            styles[`label-${size}`],
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}

          {required ? (
            <span
              className={
                styles.required
              }
            >
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={styles.control}>
        {child}
      </div>

      {error ? (
        <p className={styles.error}>
          {error}
        </p>
      ) : helperText ? (
        <p className={styles.helper}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}