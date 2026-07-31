// Badge.tsx
import React from "react";

/**
 * ---------------------------------------
 * TYPE
 * ---------------------------------------
 */

type BadgeType =
  | "type1"
  | "type2"
  | "type3";

/**
 * ---------------------------------------
 * TYPE 별 COLOR
 * ---------------------------------------
 */

type Type1Color =
  | "blue" // 가용
  | "blue2" // 투입 예약
  | "green" // 투입 중
  | "purple"; // 투입 확정

type Type2Color =
  | "primary"
  | "secondary"
  | "dark";

type Type3Color =
  | "success"
  | "warning"
  | "danger";

/**
 * ---------------------------------------
 * TYPE -> COLOR MAP
 * ---------------------------------------
 */

type BadgeColorMap = {
  type1: Type1Color;
  type2: Type2Color;
  type3: Type3Color;
};

type BadgeSize =
  | "sm"
  | "md"
  | "lg";

/**
 * ---------------------------------------
 * PROPS
 * ---------------------------------------
 */

export type BadgeProps<
  T extends BadgeType = "type1"
> =
  React.HTMLAttributes<HTMLSpanElement> & {
    type?: T;

    /**
     * type 에 따라 자동 타입 변경
     */
    color?: BadgeColorMap[T];

    size?: BadgeSize;

    rounded?: boolean;
    disabled?: boolean;

    icon?: React.ReactNode;

    className?: string;
  };

/**
 * ---------------------------------------
 * BASE STYLE
 * ---------------------------------------
 */

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",

  gap: 6,

  fontWeight: 600,
  lineHeight: 1,

  whiteSpace: "nowrap",
  userSelect: "none",

  transition:
    "background-color 150ms ease, border-color 150ms ease, color 150ms ease",
};

const roundedStyle: Record<
  string,
  React.CSSProperties
> = {
  true: {
    borderRadius: 9999,
  },

  false: {
    borderRadius: 8,
  },
};

const sizeVariants: Record<
  BadgeSize,
  React.CSSProperties
> = {
  sm: {
    padding: "4px 8px",
    fontSize: 11,
  },

  md: {
    padding: "6px 10px",
    fontSize: 12,
  },

  lg: {
    padding: "8px 14px",
    fontSize: 14,
  },
};

/**
 * ---------------------------------------
 * VARIANT MAP TYPE
 * ---------------------------------------
 */

type BadgeVariantMap = {
  type1: Record<
    Type1Color,
    React.CSSProperties
  >;

  type2: Record<
    Type2Color,
    React.CSSProperties
  >;

  type3: Record<
    Type3Color,
    React.CSSProperties
  >;
};

/**
 * ---------------------------------------
 * VARIANTS
 * ---------------------------------------
 */

const badgeVariants: BadgeVariantMap =
  {
    /**
     * TYPE1
     * OUTLINE
     */
    type1: {
      blue: {
        color: "#3385FF",
        backgroundColor: "#E0EDFF",
      },

      blue2: {
        color: "#3385FF",
        backgroundColor: "#E0EDFF",
      },

      green: {
        color: "#03A27D",
        backgroundColor: "#E6FAF5",
      },

      purple: {
        color: "#6C1DDA",
        backgroundColor: "#F2E9FF",
      },
    },

    /**
     * TYPE2
     * FILLED
     */
    type2: {
      primary: {
        backgroundColor:
          "#2563EB",
        color: "#FFFFFF",
      },

      secondary: {
        backgroundColor:
          "#6B7280",
        color: "#FFFFFF",
      },

      dark: {
        backgroundColor:
          "#111827",
        color: "#FFFFFF",
      },
    },

    /**
     * TYPE3
     * OUTLINE + BG
     */
    type3: {
      success: {
        backgroundColor:
          "#F0FDF4",
        color: "#16A34A",
        border:
          "1px solid #BBF7D0",
      },

      warning: {
        backgroundColor:
          "#FFFBEB",
        color: "#D97706",
        border:
          "1px solid #FDE68A",
      },

      danger: {
        backgroundColor:
          "#FEF2F2",
        color: "#DC2626",
        border:
          "1px solid #FECACA",
      },
    },
  };

/**
 * ---------------------------------------
 * DISABLED
 * ---------------------------------------
 */

const disabledStyle: React.CSSProperties =
  {
    opacity: 0.5,
    pointerEvents: "none",
    cursor: "not-allowed",
  };

/**
 * ---------------------------------------
 * ACCESSOR
 * 실무 추천 패턴
 * ---------------------------------------
 */

function getBadgeVariant<T extends BadgeType>(type: T, color: BadgeColorMap[T]): React.CSSProperties {
  /* `T`에 따른 color 키는 런타임에서 항상 일치 — TS 인덱스 한계로 Record 단언 */
  const row = badgeVariants[type] as Record<string, React.CSSProperties>;
  return row[color as string];
}

/**
 * ---------------------------------------
 * COMPONENT
 * ---------------------------------------
 */

export default function Badge<
  T extends BadgeType = "type1"
>({
  children,
  type = "type1" as T,
  color,
  size = "md",
  rounded = false,
  disabled = false,
  icon,
  className = "badge",
  style,
  ...props
}: BadgeProps<T>) {
  /**
   * TYPE 별 기본 COLOR
   */
  const defaultColorMap = {
    type1: "blue",
    type2: "primary",
    type3: "success",
  } as const;

  const resolvedColor =
    color ??
    defaultColorMap[type];

  /**
   * 타입 안전 accessor 사용
   */
  const variantStyle =
    getBadgeVariant(
      type,
      resolvedColor
    );

  return (
    <span
      className={className}
      aria-disabled={disabled}
      style={{
        ...baseStyle,
        ...roundedStyle[
          String(rounded)
        ],
        ...sizeVariants[size],
        ...variantStyle,
        ...(disabled
          ? disabledStyle
          : {}),
        ...style,
      }}
      {...props}
    >
      {icon && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}