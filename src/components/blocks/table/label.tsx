import { Badge } from "@/components/ui/badge";

export default function TableItemLabel({
  value,
  options,
  className,
}: {
  value: string;
  options?: { variant?: 'default' | 'secondary' | 'destructive' | 'outline' };
  className?: string;
}) {
  return (
    <Badge variant={options?.variant ?? "secondary"} className={className}>
      {value}
    </Badge>
  );
}
