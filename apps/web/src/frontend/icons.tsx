import type { IconName } from "./types";

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

const paths: Record<IconName, JSX.Element> = {
  block: (
    <>
      <path d="M12 2 21 7v10l-9 5-9-5V7z" />
      <path d="M3.3 7 12 12l8.7-5M12 12v10" />
    </>
  ),
  brush: (
    <>
      <path d="M3 21c2.2 0 4-1.8 4-4l9-9-3-3-9 9c-2.2 0-4 1.8-4 4Z" />
      <path d="m13 5 3 3 4-4-3-3z" />
    </>
  ),
  car: (
    <>
      <path d="M4 13l1.8-5.2A2 2 0 0 1 7.7 6.5h8.6a2 2 0 0 1 1.9 1.3L20 13v4h-2.5M6.5 17H4v-4" />
      <path d="M4 13h16" />
      <circle cx="7.5" cy="17" r="1.8" />
      <circle cx="16.5" cy="17" r="1.8" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  coins: (
    <>
      <ellipse cx="9" cy="6.5" rx="6" ry="3" />
      <path d="M3 6.5v5c0 1.7 2.7 3 6 3" />
      <ellipse cx="15" cy="14" rx="6" ry="3" />
      <path d="M9 14v3.5c0 1.7 2.7 3 6 3s6-1.3 6-3V14" />
    </>
  ),
  community: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <circle cx="17.5" cy="9.5" r="2.2" />
      <path d="M16 14.2A4.6 4.6 0 0 1 21 18.4" />
    </>
  ),
  crown: <path d="M3 8l4.2 3.8L12 5l4.8 6.8L21 8v9H3z" />,
  events: (
    <>
      <path d="M5 22V3" />
      <path d="M5 4h12l-2.2 3.5L17 11H5" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="11" r="2.4" />
      <path d="M12 8.6C12 5 14 4 14 4s-.6 2.7-2 4.6M12 8.6C12 5 10 4 10 4s.6 2.7 2 4.6M12 13.4V20M9.6 11C6 11 5 13 5 13s2.7-.6 4.6-2M14.4 11C18 11 19 13 19 13s-2.7-.6-4.6-2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" />
    </>
  ),
  hammer: (
    <>
      <path d="m3 21 8-8" />
      <path d="m12.5 6.5 5 5" />
      <path d="m12 4 8 8 2-2-4-4z" />
    </>
  ),
  home: (
    <>
      <path d="M4 21V10.5L12 4l8 6.5V21" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  palace: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V10l7-5 7 5v11" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 10v3M15 10v3" />
    </>
  ),
  paw: (
    <>
      <circle cx="6" cy="11" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="6.6" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="6.6" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="18" cy="11" r="1.9" fill="currentColor" stroke="none" />
      <path
        d="M12 12c-3 0-5 2.2-5 4.8 0 1.8 1.3 3.2 3 3.2 1 0 1.4-.5 2-.5s1 .5 2 .5c1.7 0 3-1.4 3-3.2C17 14.2 15 12 12 12Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  play: <polygon points="7,4 20,12 7,20" fill="currentColor" stroke="none" />,
  reply: <path d="M21 11.5a8 8 0 0 1-11.5 7.2L4 20l1.3-4.4A8 8 0 1 1 21 11.5Z" />,
  repost: <path d="M4 9V8a3 3 0 0 1 3-3h9l-2.6-2.6M20 15v1a3 3 0 0 1-3 3H8l2.6 2.6" />,
  ring: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  check: <path d="M5 12.5 10 17.5 19.5 6.5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4-4" />
    </>
  ),
  shirt: <path d="M8 3 4 6 2 9l3 2.5V21h14v-9.5L22 9l-2-3-4-3-4 2.5z" />,
  spark: <path d="M12 2l2.1 6.3L20.4 10l-6.3 1.7L12 18l-2.1-6.3L3.6 10l6.3-1.7z" />,
  sprout: (
    <>
      <path d="M12 22V11" />
      <path d="M12 13C12 9 9.5 7 6 7c0 4 2.5 6 6 6Z" />
      <path d="M12 11c0-3.2 2.2-5 5.5-5 0 3.5-2.3 5-5.5 5Z" />
    </>
  ),
  store: (
    <>
      <path d="M3.5 9 5 4.5h14L20.5 9M4.5 9v10.5h15V9M4 9h16" />
      <path d="M9 19.5V14h6v5.5" />
    </>
  ),
  zap: <path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor" stroke="none" />,
};

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}
