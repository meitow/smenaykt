import { NotificationsPanel } from "@/components/NotificationsPanel";
import { t } from "@/lib/i18n";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t("notifications.pageTitle")}</h1>
        <p className="mt-1 text-[15px] text-muted">{t("notifications.pageHint")}</p>
      </div>
      <NotificationsPanel />
    </div>
  );
}
