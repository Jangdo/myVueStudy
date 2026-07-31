import React from "react";

/* =========================
   Icon Type
========================= */

export type IconName =
  | "exsearch"
  | "exclose"
  | "excheck"
  | "formCheck"
  | "clear"
  | "download"
;

type IconProps = {
  iconName: IconName;
  width?: number;
  height?: number;
  viewBox?: string;
  color?: string;
  className?: string;
};

/* =========================
   Base Class
========================= */

const ICON_BASE_CLASS = "icon";

/* =========================
   className util
========================= */

function mergeClassNames(
  ...classes: (string | undefined | false | null)[]
) {
  return classes
    .filter(Boolean)
    .join(" ");
}

/* =========================
   SVG Registry
========================= */

const icons: Record<
  IconName,
  (props: React.SVGProps<SVGSVGElement>) => React.ReactNode
> = {
  exsearch: (props) => (
    <svg {...props} fill="none">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),

  exclose: (props) => (
    <svg {...props} fill="none">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),

  excheck: (props) => (
    <svg {...props} fill="none">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),

  formCheck: (props) => (
    <svg {...props} viewBox="0 0 9 6" fill="none">
      <path d="M1 3.2L3.2 5.2L7.6 0.4" />
    </svg>
  ),

  clear: (props) => (
    <svg {...props} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="10" />
      <path d="M13 7L7 13M7 7L13 13" />
    </svg>
  ),

  download: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 8 8" fill="none">
      <g filter="url(#filter0_i_4480_2339)">
        <path
          d="M0 6.13672C0 5.86058 0.223858 5.63672 0.5 5.63672C0.776142 5.63672 1 5.86058 1 6.13672V7H7V6.13672C7 5.86058 7.22386 5.63672 7.5 5.63672C7.77614 5.63672 8 5.86058 8 6.13672V7.5C8 7.77614 7.77614 8 7.5 8H0.5C0.223858 8 7.73104e-07 7.77614 0 7.5V6.13672ZM3.50391 0.5C3.50391 0.223858 3.72776 0 4.00391 0C4.28003 2.64126e-05 4.50391 0.223874 4.50391 0.5V4.4873L5.95898 3.05273C6.15567 2.85907 6.47223 2.86197 6.66602 3.05859C6.85968 3.25528 6.85775 3.57184 6.66113 3.76562L4.35449 6.03809C4.15976 6.22983 3.84692 6.23003 3.65234 6.03809L1.34863 3.76465C1.15238 3.57069 1.14993 3.25409 1.34375 3.05762C1.53769 2.86112 1.85423 2.85981 2.05078 3.05371L3.50391 4.48633V0.5Z"
          fill="#7C8390"
        />
      </g>
      <defs>
      <filter id="filter0_i_4480_2339" x="0" y="0" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset/>
      <feGaussianBlur stdDeviation="50"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.372549 0 0 0 0 0.4 0 0 0 0 0.458824 0 0 0 1 0"/>
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_4480_2339"/>
      </filter>
      </defs>
    </svg>
  ),
};

/* =========================
   Icon Component
========================= */

export default function Icon({
  iconName,
  width = 24,
  height = 24,
  viewBox = "0 0 24 24",
  color = "currentColor",
  className,
}: IconProps) {
  const Svg = icons[iconName];

  if (!Svg) return null;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={viewBox}
      stroke={color}
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
      className={mergeClassNames(
        ICON_BASE_CLASS,
        className
      )}
    />
  );
}
