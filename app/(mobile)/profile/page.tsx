import { ProfilePanel } from "@/components/ProfilePanel";
import { t } from "@/lib/i18n";

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <p className="text-[15px] text-muted">{t("profile.pageHint")}</p>
      <ProfilePanel />
    </div>
  );
}
