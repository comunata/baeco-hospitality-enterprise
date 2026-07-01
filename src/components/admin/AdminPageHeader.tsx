export function AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-ivory">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-stone">{description}</p>}
      </div>
      {action}
    </div>
  );
}
