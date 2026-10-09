import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import { Link } from "@/i18n/routing";
import NextLink from "next/link";
import Image from "next/image";

export default function Footer({ footer }: { footer: FooterType }) {
  if (footer.disabled) {
    return null;
  }

  return (
    <footer id={footer.name} className="dark border-t border-white/10 bg-[#0B0C15] py-16">
      <div className="container">
        <div className="flex flex-col justify-between gap-12 lg:flex-row lg:gap-16">
          <div className="flex max-w-sm flex-col gap-6">
            {footer.brand && (
              <div>
                <div className="flex items-center gap-3">
                  {footer.brand.logo && footer.brand.logo.src && (
                    <Image
                      src={footer.brand.logo.src}
                      alt={footer.brand.logo.alt || footer.brand.title || "Logo"}
                      width={44}
                      height={44}
                      className="h-11 w-auto"
                    />
                  )}
                  {footer.brand.title && (
                    <p className="font-display text-3xl font-semibold text-white">
                      {footer.brand.title}
                    </p>
                  )}
                </div>
                {footer.brand.description && (
                  <p className="mt-4 text-base leading-relaxed text-white/60">
                    {footer.brand.description}
                  </p>
                )}
              </div>
            )}
            {footer.social && (
              <ul className="flex items-center gap-4 text-muted-foreground">
                {footer.social.items?.map((item, i) => {
                  if (!item.url) return null;
                  const isExternal = item.url.startsWith('http://') || item.url.startsWith('https://');
                  const LinkComponent = isExternal ? 'a' : Link;
                  return (
                    <li key={i}>
                      <LinkComponent
                        href={item.url as any}
                        target={item.target}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-primary hover:text-primary hover:bg-white/10"
                      >
                        {item.icon && (
                          <Icon name={item.icon} className="size-4" />
                        )}
                      </LinkComponent>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-20">
            {footer.nav?.items?.map((item, i) => (
              <div key={i}>
                <p className="mb-5 font-mono text-sm font-semibold uppercase tracking-wider text-white">
                  {item.title}
                </p>
                <ul className="space-y-3 text-sm text-white/60">
                  {item.children?.map((iitem, ii) => {
                    if (!iitem.url) return null;
                    const isExternal = iitem.url.startsWith('http://') || iitem.url.startsWith('https://');
                    const LinkComponent = isExternal ? 'a' : Link;
                    return (
                      <li key={ii}>
                        <LinkComponent
                          href={iitem.url as any}
                          target={iitem.target}
                          className="transition-colors hover:text-white hover:underline hover:underline-offset-4"
                        >
                          {iitem.title}
                        </LinkComponent>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 text-sm text-white/60 lg:flex-row">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-6">
            {footer.copyright && (
              <p>
                {footer.copyright}
              </p>
            )}
            <a href="https://aidirs.org/item/ai-powered-watermark-remover" target="_blank" rel="noopener noreferrer" className="inline-block transition-opacity hover:opacity-80">
              <img src="https://aidirs.org/badges/badge-listed-dark.svg" alt="Listed on AIDirs" className="h-6 w-auto" />
            </a>
          </div>

          {footer.agreement && (
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 lg:justify-start">
              {footer.agreement.items?.map((item, i) => {
                if (!item.url) return null;
                const isExternal = item.url.startsWith('http://') || item.url.startsWith('https://');
                const isLegalPage = item.url === '/privacy-policy' || item.url === '/terms-of-service';
                
                // Use regular Next.js Link for legal pages (which are outside [locale] route group)
                // Use internationalized Link for other pages
                const LinkComponent = isExternal ? 'a' : (isLegalPage ? NextLink : Link);
                
                return (
                  <li key={i}>
                    <LinkComponent
                      href={item.url as any}
                      target={item.target}
                      className="transition-colors hover:text-white hover:underline hover:underline-offset-4"
                    >
                      {item.title}
                    </LinkComponent>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
