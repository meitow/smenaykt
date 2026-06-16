type FormPageHeaderProps = {
  title: string;
};

export function FormPageHeader({ title }: FormPageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="h-0.5 w-full bg-brand-gradient" aria-hidden />
      <div className="app-shell px-4 py-3">
        <h1 className="text-[17px] font-bold text-ink">{title}</h1>
      </div>
    </header>
  );
}
