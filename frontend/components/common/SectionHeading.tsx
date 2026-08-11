interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionHeading({
  title,
  subtitle,
}: Props) {
  return (
    <div className="mb-12 text-center">
      <h2 className="text-4xl font-bold tracking-tight">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}