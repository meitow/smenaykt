import { NotificationWatcher } from "@/components/NotificationWatcher";
import { PartnerHeaderActions } from "@/components/partner/PartnerHeaderActions";
import { PartnerLogoMenu } from "@/components/partner/PartnerLogoMenu";

export default function PartnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-page">
      <div className="ambient-blob -left-20 top-16 h-52 w-52 bg-brand/20" aria-hidden />
      <div className="ambient-blob -right-16 top-48 h-44 w-44 bg-taiga/15" aria-hidden />
      <NotificationWatcher variant="partner" />
      <header className="border-b border-black/5 bg-white">
        <div className="app-shell flex items-center justify-between gap-4 px-4 py-4">
          <PartnerLogoMenu />
          <PartnerHeaderActions />
        </div>
      </header>
      <main className="app-shell px-4 py-6">{children}</main>
    </div>
  );
}
