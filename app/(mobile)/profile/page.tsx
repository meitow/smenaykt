import { ProfilePanel } from "@/components/ProfilePanel";
import { t } from "@/lib/i18n";

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t("nav.profile")}</h1>
        <p className="mt-1 text-[15px] text-muted">{t("profile.pageHint")}</p>
      </div>
      <ProfilePanel />
    </div>
  );
}
