"use client";

import styles from "./RadioGroup.module.css";

type RadioGroupProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;

  options: {
    label: string;
    value: string;
  }[];

  disabled?: boolean;
};

export default function RadioGroup({
  name,
  value,
  onChange,
  options,
  disabled,
}: RadioGroupProps) {
  return (
    <div
      className={
        styles.group
      }
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={
            styles.item
          }
        >
          <input
            type="radio"
            name={name}
            value={
              opt.value
            }
            disabled={
              disabled
            }
            checked={
              value ===
              opt.value
            }
            onChange={() =>
              onChange(
                opt.value
              )
            }
            className={
              styles.input
            }
          />

          <span
            className={
              styles.circle
            }
          />

          <span
            className={
              styles.label
            }
          >
            {
              opt.label
            }
          </span>
        </label>
      ))}
    </div>
  );
}