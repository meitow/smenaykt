import { PostTaskForm } from "@/components/PostTaskForm";
import { t } from "@/lib/i18n";

export default function PostTaskPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t("personal.createTitle")}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{t("personal.createHint")}</p>
      </div>
      <PostTaskForm />
    </div>
  );
}
