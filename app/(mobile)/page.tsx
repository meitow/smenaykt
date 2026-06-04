import { TaskFeed } from "@/components/TaskFeed";
import type { SourceFilter } from "@/lib/task-filters";

type HomePageProps = {
  searchParams: Promise<{ source?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { source } = await searchParams;
  const initialSource: SourceFilter | undefined =
    source === "person" || source === "partner" ? source : undefined;

  return <TaskFeed showHero initialSource={initialSource} />;
}
