import Image from "next/image";
import Link from "next/link";

type UserAvatarProps = {
  name?: string;
  imageUrl?: string | null;
  size?: number;
  href?: string;
  className?: string;
};

function initials(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function UserAvatar({
  name = "Гость",
  imageUrl,
  size = 40,
  href,
  className = "",
}: UserAvatarProps) {
  const inner = imageUrl ? (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ring-2 ring-white ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={!!href}
    >
      <Image src={imageUrl} alt="" fill className="object-cover" sizes={`${size}px`} unoptimized />
    </div>
  ) : (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-gradient-soft font-bold text-brand-dark ring-2 ring-white ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden={!!href}
    >
      {initials(name)}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0" aria-label="Профиль">
        {inner}
      </Link>
    );
  }

  return inner;
}
