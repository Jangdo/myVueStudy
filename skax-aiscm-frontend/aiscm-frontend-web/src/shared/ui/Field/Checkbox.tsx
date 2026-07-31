"use client";

import styles from "./Checkbox.module.css";

type CheckboxProps = {
  id?: string;
  name?: string;
  disabled?: boolean;

  checked: boolean;
  onChange: (checked: boolean) => void;

  label?: string;
};

export default function Checkbox({
  id,
  name,
  disabled,
  checked,
  onChange,
  label,
}: CheckboxProps) {
  return (
    <label
      className={styles.wrapper}
      htmlFor={id}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={(e) =>
          onChange(
            e.target.checked
          )
        }
        className={
          styles.input
        }
      />

      <span
        className={
          styles.box
        }
      />

      {label ? (
        <span
          className={
            styles.label
          }
        >
          {label}
        </span>
      ) : null}
    </label>
  );
}