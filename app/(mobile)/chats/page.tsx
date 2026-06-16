import { ChatsInbox } from "@/components/ChatsInbox";
import { t } from "@/lib/i18n";

export default function ChatsPage() {
  return (
    <div className="space-y-4">
      <p className="text-[15px] text-muted">{t("chat.inboxHint")}</p>
      <ChatsInbox />
    </div>
  );
}
