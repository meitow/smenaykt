import { PostTaskForm } from "@/components/PostTaskForm";
import { t } from "@/lib/i18n";

export default function PostTaskPage() {
  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-muted">{t("personal.createHint")}</p>
      <PostTaskForm />
    </div>
  );
}
