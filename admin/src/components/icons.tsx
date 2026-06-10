type P = Readonly<{
  size?: number;
}>;
const s = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IGrid = ({ size }: P) => (
  <svg {...s(size)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
export const IOrders = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
);
export const IMenu = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="M4 10h16v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z" />
    <path d="M2 10h20M8 10V7M16 10V7" />
  </svg>
);
export const ITag = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="M3 12V4h8l9 9-8 8-9-9Z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </svg>
);
export const ILayers = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5M3 18l9 5 9-5" />
  </svg>
);
export const IUsers = ({ size }: P) => (
  <svg {...s(size)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0M16 5.5a3.2 3.2 0 0 1 0 6M18 20a6 6 0 0 0-3-5" />
  </svg>
);
export const ILogout = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);
export const IRupee = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="M6 4h12M6 8h12M16 4a6 6 0 0 1-6 6h-1l7 8M6 8h4" />
  </svg>
);
export const IClock = ({ size }: P) => (
  <svg {...s(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IPlus = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const ISearch = ({ size }: P) => (
  <svg {...s(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
export const ISend = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);
export const IPalette = ({ size }: P) => (
  <svg {...s(size)}>
    <path d="M12 21a9 9 0 1 1 9-9c0 2.2-1.8 3-3 3h-2a2 2 0 0 0-1.5 3.3c.4.5.5 1.2 0 1.7-.6.6-1.6 1-2.5 1Z" />
    <circle cx="7.5" cy="11.5" r="1.2" />
    <circle cx="10.5" cy="7.5" r="1.2" />
    <circle cx="15" cy="7.5" r="1.2" />
  </svg>
);
