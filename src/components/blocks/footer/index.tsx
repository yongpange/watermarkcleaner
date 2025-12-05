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
    <section id={footer.name} className="py-16">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              {footer.brand && (
                <div>
                  <div className="flex items-center justify-center gap-2 lg:justify-start">
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
                      <p className="text-3xl font-semibold">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-6 text-md text-muted-foreground">
                      {footer.brand.description}
                    </p>
                  )}
                </div>
              )}
              {footer.social && (
                <ul className="flex items-center space-x-6 text-muted-foreground">
                  {footer.social.items?.map((item, i) => {
                    if (!item.url) return null;
                    const isExternal = item.url.startsWith('http://') || item.url.startsWith('https://');
                    const LinkComponent = isExternal ? 'a' : Link;
                    return (
                      <li key={i} className="font-medium hover:text-primary">
                        <LinkComponent href={item.url as any} target={item.target}>
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
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              {footer.nav?.items?.map((item, i) => (
                <div key={i}>
                  <p className="mb-6 font-bold">{item.title}</p>
                  <ul className="space-y-4 text-sm text-muted-foreground">
                    {item.children?.map((iitem, ii) => {
                      if (!iitem.url) return null;
                      const isExternal = iitem.url.startsWith('http://') || iitem.url.startsWith('https://');
                      const LinkComponent = isExternal ? 'a' : Link;
                      return (
                        <li key={ii} className="font-medium hover:text-primary">
                          <LinkComponent href={iitem.url as any} target={iitem.target}>
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
          <div className="mt-8 flex flex-col justify-between gap-4 border-t pt-8 text-center text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            {footer.copyright && (
              <p>
                {footer.copyright}
              </p>
            )}

            {footer.agreement && (
              <ul className="flex justify-center gap-4 lg:justify-start">
                {footer.agreement.items?.map((item, i) => {
                  if (!item.url) return null;
                  const isExternal = item.url.startsWith('http://') || item.url.startsWith('https://');
                  const isLegalPage = item.url === '/privacy-policy' || item.url === '/terms-of-service';
                  
                  // Use regular Next.js Link for legal pages (which are outside [locale] route group)
                  // Use internationalized Link for other pages
                  const LinkComponent = isExternal ? 'a' : (isLegalPage ? NextLink : Link);
                  
                  return (
                    <li key={i} className="hover:text-primary">
                      <LinkComponent href={item.url as any} target={item.target}>
                        {item.title}
                      </LinkComponent>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
}
