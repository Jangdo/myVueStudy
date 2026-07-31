"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import Icon from "@/shared/ui/Icon/IconSvg";
import styles from "./Checkbox.module.css";

/**
 * Figma 4상태(미선택 / 선택 / disabled·미선택 / disabled·선택) = `checked` + `disabled` 조합
 */
export type CommonCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
> & {
  className?: string;
  /** 옵션: 옆에 붙이는 라벨 텍스트 */
  children?: ReactNode;
};

const Checkbox = forwardRef<HTMLInputElement, CommonCheckboxProps>(function CommonCheckbox(
  { className, children, id: idProp, disabled, ...inputProps },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? `ui-checkbox-${autoId.replace(/[:]/g, "")}`;

  return (
    <label
      className={[styles.root, className].filter(Boolean).join(" ")}
      htmlFor={id}
      data-disabled={disabled ? "true" : undefined}
    >
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className={styles.input}
        disabled={disabled}
        {...inputProps}
      />
      <span className={styles.item}>
        <Icon iconName="formCheck" color="#ffffff" />
      </span>
      {children != null && children !== false && <span className={styles.text}>{children}</span>}
    </label>
  );
});

Checkbox.displayName = "Checkbox";

export default Checkbox;
