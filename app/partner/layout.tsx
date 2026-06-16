import { NotificationWatcher } from "@/components/NotificationWatcher";
import { PartnerShell } from "@/components/partner/PartnerShell";

export default function PartnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PartnerShell>{children}</PartnerShell>;
}
