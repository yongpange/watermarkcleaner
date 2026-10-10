import Link from 'next/link';

interface CTAButtonProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export default function CTAButton({ href = 'https://watermarkcleaner.com', children, className = '' }: CTAButtonProps) {
  return (
    <p className={`my-8 ${className}`}>
      <Link
        href={href}
        className="inline-flex items-center gap-2 border-b border-foreground/40 pb-0.5 text-[1.05rem] font-medium text-foreground no-underline transition-colors hover:border-foreground"
      >
        {children}
        <span aria-hidden="true">→</span>
      </Link>
    </p>
  );
}
