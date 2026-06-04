import Link from "next/link";
import { MobileShell } from "@/components/MobileShell";

export default function MobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MobileShell>{children}</MobileShell>;
}
