import Image from "next/image";

type AppLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function AppLogo({ size = 44, className = "", priority = false }: AppLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="SmenaYKT"
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
