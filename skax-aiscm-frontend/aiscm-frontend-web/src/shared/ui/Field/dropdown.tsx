"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Dropdown.module.css";

type DropdownProps = {
  placeholder?: string;
  options: string[];
  onChange?: (value: string) => void;
};

export default function Dropdown({
  placeholder = "선택하세요",
  options,
  onChange,
}: DropdownProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (value: string) => {
    setSelected(value);
    onChange?.(value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={styles.fieldBox}>
      <button
        type="button"
        className={[styles.optTitle, !selected ? styles.placeholder : styles.selected].filter(Boolean).join(" ")}
        onClick={toggleDropdown}
      >
        {selected || placeholder}
      </button>
      {isOpen ? (
        <div className={styles.optionGroup}>
          {options.map((option) => (
            <button key={option} type="button" className={styles.option} onClick={() => handleSelect(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
