export function AdminPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <h1 className="text-3xl font-extrabold tracking-[-0.025em] text-green-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-[68ch] text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
        {description}
      </p>
    </header>
  );
}
