import Link from 'next/link';

interface CTAButtonProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export default function CTAButton({ href = 'https://watermarkcleaner.com', children, className = '' }: CTAButtonProps) {
  return (
    <div className={`flex justify-center my-12 ${className}`}>
      <Link
        href={href}
        className="group relative inline-flex items-center justify-center px-10 py-4 text-xl font-bold text-white transition-all duration-300 ease-out bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] rounded-full shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.7)] hover:-translate-y-1"
      >
        <span className="relative flex items-center gap-2">
          {children}
          <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path>
          </svg>
        </span>
      </Link>
    </div>
  );
}
