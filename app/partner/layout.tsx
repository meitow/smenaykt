import { AppLogo } from "@/components/AppLogo";
import { NotificationWatcher } from "@/components/NotificationWatcher";
import { PartnerHeaderActions } from "@/components/partner/PartnerHeaderActions";

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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-page">
              <AppLogo size={44} />
            </div>
            <div>
              <p className="text-lg font-bold text-ink">SmenaYKT Partner</p>
              <p className="text-sm text-muted">Кабинет для предприятий · Якутск</p>
            </div>
          </div>
          <PartnerHeaderActions />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
