import { ChatsInbox } from "@/components/ChatsInbox";
import { t } from "@/lib/i18n";

export default function ChatsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t("chat.inboxTitle")}</h1>
        <p className="mt-1 text-[15px] text-muted">{t("chat.inboxHint")}</p>
      </div>
      <ChatsInbox />
    </div>
  );
}
