"use client";

import { useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./InputBox.module.css";
import Icon from "@/shared/ui/Icon/IconSvg";

export type DataType = "text" | "password" | "tel" | "number";
export type DataSize = "sm" | "md" | "lg" | "xl";

export type InputBoxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "type" | "id" | "name" | "placeholder" | "children" | "size"
> & {
  label?: string;
  className?: string;
  type?: DataType;
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  children?: ReactNode;
  size?: DataSize;
  clear?: boolean;
  suffix?: ReactNode;
};

const dataSize: Record<DataSize, string> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

export default function InputBox({
  label,
  className,
  type="text",
  id,
  name,
  placeholder,
  size = "md",
  disabled,
  children,
  clear,
  required,
  suffix,
  ...rest
}: InputBoxProps) {
  void children;
  const [inputValue, setInputValue] = useState<string>("");
  const [isFocus, setIsFocus] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInputValue(e.target.value);
  };

   const handleFocus = () => {
    setIsFocus(true);
  };

  const handleBlur = () => {
    setIsFocus(false);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleClear = () => {
    setInputValue("");
     inputRef.current?.focus();
  };


  return (
    <div
      className={[
        styles.root,
        required && styles.required,
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      { label ? (
        <label
          htmlFor={id ?? undefined}
          className={styles.label}
        >
          {label}
        </label>
      ) : null }
      <span
        className={[
          styles.box,
          isFocus && styles.focus,
          styles[dataSize[size]],
        ]
        .filter(Boolean)
        .join(" ")}
      >
        <input
          ref={inputRef}
          type={type}
          id={id}
          name={name}
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          data-size={dataSize[size] ?? "md"}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={styles.input}
          {...rest}
        />
        {suffix}
        {clear === true && inputValue.length > 0 ? (
          <button
            type="button"
            className={styles.buttonClear}
            onClick={handleClear}
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => e.preventDefault()}
          >
            <Icon iconName="clear" />
          </button>
        ) : null }
      </span>
    </div>
  );
}
