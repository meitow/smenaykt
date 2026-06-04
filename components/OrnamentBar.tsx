type OrnamentBarProps = {
  className?: string;
};

export function OrnamentBar({ className = "" }: OrnamentBarProps) {
  return (
    <div
      className={`h-2 w-full bg-[repeating-linear-gradient(90deg,#ffffff33_0px,#ffffff33_8px,transparent_8px,transparent_16px)] ${className}`}
      aria-hidden
    />
  );
}
