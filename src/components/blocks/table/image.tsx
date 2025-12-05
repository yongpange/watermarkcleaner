import Image from "next/image";

export default function TableItemImage({
  value,
  options,
  className,
}: {
  value: string;
  options?: { alt?: string };
  className?: string;
}) {
  return (
    <Image
      src={value || "/placeholder-avatar.png"}
      alt={options?.alt || "Image"}
      width={40}
      height={40}
      className={`w-10 h-10 rounded-full ${className}`}
    />
  );
}
