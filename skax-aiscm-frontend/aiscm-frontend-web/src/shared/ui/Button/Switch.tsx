"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import styles from "./Switch.module.css";

type SwitchMode = "toggle" | "option";

type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> & {
  label?: string;
  hideLabel?: boolean;

  /* 기본 on/off */
  checked?: boolean;

  /* option 모드 */
  mode?: SwitchMode;
  option1?: string;
  option2?: string;

  onToggleChange?: (checked: boolean) => void;
  onOptionChange?: (value: string) => void;
};

export default function Switch({
  label,
  hideLabel = false,
  checked = false,
  disabled,
  className = "",

  mode = "toggle",
  option1 = "Option 1",
  option2 = "Option 2",

  onToggleChange,
  onOptionChange,

  ...rest
}: SwitchProps) {
  const [isChecked, setIsChecked] =
    useState(checked);

  const [selectedOption, setSelectedOption] =
    useState(option1);

  const handleToggle = () => {
    const next = !isChecked;

    setIsChecked(next);

    onToggleChange?.(next);
  };

  const handleOptionSelect = (
    value: string
  ) => {
    setSelectedOption(value);

    onOptionChange?.(value);
  };

  /* OPTION MODE */
  if (mode === "option") {
    return (
      <div
        className={[
          styles.optionRoot,
          disabled && styles.disabled,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label ? (
          <span className={styles.label}>
            {label}
          </span>
        ) : null}

        <div className={styles.optionGroup}>
          <button
            type="button"
            disabled={disabled}
            className={[
              styles.optionButton,
              selectedOption === option1 &&
                styles.active,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() =>
              handleOptionSelect(option1)
            }
          >
            {option1}
          </button>

          <button
            type="button"
            disabled={disabled}
            className={[
              styles.optionButton,
              selectedOption === option2 &&
                styles.active,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() =>
              handleOptionSelect(option2)
            }
          >
            {option2}
          </button>
        </div>
      </div>
    );
  }

  /* TOGGLE MODE */
  return (
    <label
      className={[
        styles.root,
        disabled && styles.disabled,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        onChange={handleToggle}
        className={styles.input}
        {...rest}
      />

      <span className={styles.switch}>
        <span className={styles.thumb} />
      </span>

      {!hideLabel && label ? (
        <span className={styles.label}>
          {label}
        </span>
      ) : null}
    </label>
  );
}