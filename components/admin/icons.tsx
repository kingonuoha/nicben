import type { SVGProps } from "react";

/**
 * The portal's icon set.
 *
 * One set, one stroke width, drawn inline. `docs/04-design-system.md` §8 forbids
 * mixed icon sets and emoji-as-icons, and the design screens' Material Symbols
 * font is a Stage artefact (no icon font is loaded by this application), so the
 * eleven glyphs the portal needs are drawn here with `currentColor` — which means
 * they take their colour from the token class on the parent and never carry a
 * literal of their own (D-003).
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      width={18}
      height={18}
      {...props}
    >
      {children}
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V7.75a4 4 0 0 1 8 0v2.75" />
      <path d="M12 14.5v2" />
    </Icon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 5 6v6c0 4 3 7 7 8.5 4-1.5 7-4.5 7-8.5V6l-7-2.5Z" />
      <path d="m9.25 12 2 2 3.5-3.75" />
    </Icon>
  );
}

export function AtIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.75" />
      <path d="M15.75 12v1.5a2.25 2.25 0 0 0 4.5 0V12a8.25 8.25 0 1 0-3.25 6.55" />
    </Icon>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="12" r="3.25" />
      <path d="M11.25 12H21M17.5 12v3M14.5 12v2.25" />
    </Icon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.75 12S6.5 5.75 12 5.75 21.25 12 21.25 12 17.5 18.25 12 18.25 2.75 12 2.75 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </Icon>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6A9.9 9.9 0 0 1 12 5.75c5.5 0 9.25 6.25 9.25 6.25a17 17 0 0 1-3.3 4.05" />
      <path d="M6.4 7.9A16.6 16.6 0 0 0 2.75 12S6.5 18.25 12 18.25a9.6 9.6 0 0 0 3.4-.6" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </Icon>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 12h-15" />
      <path d="m10.5 6-6 6 6 6" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5v11" />
      <path d="m7.75 10.5 4.25 4 4.25-4" />
      <path d="M4.5 20.5h15" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.25 21 19.75H3L12 4.25Z" />
      <path d="M12 10v4" />
      <path d="M12 16.75v.5" />
    </Icon>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.75 13.5 6.5 5.25h11L20.25 13.5v5H3.75v-5Z" />
      <path d="M3.75 13.5h4l1 2h6.5l1-2h4" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  );
}

export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 4.5h4.5v15H15" />
      <path d="M13 12H4.5" />
      <path d="m7.5 8.5-3.5 3.5 3.5 3.5" />
    </Icon>
  );
}

export function DatabaseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6.75" rx="7" ry="2.75" />
      <path d="M5 6.75v10.5c0 1.52 3.13 2.75 7 2.75s7-1.23 7-2.75V6.75" />
      <path d="M5 12c0 1.52 3.13 2.75 7 2.75s7-1.23 7-2.75" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.75h9.5L19 7.25v13H6v-16.5Z" />
      <path d="M9 11h6M9 15h6" />
    </Icon>
  );
}
