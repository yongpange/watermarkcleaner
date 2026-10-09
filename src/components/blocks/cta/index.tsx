import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import Link from "next/link";
import { Section as SectionType } from "@/types/blocks/section";
import { Spotlight } from "@/components/motion/Spotlight";

export default function CTA({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16">
      <div className="container">
        <div className="dark relative overflow-hidden rounded-2xl bg-card text-card-foreground">
          <Spotlight>
            <div className="relative px-8 py-16 text-center md:px-16 md:py-20">
              <div className="mx-auto max-w-(--breakpoint-md)">
                <h2 className="mb-5 font-display text-balance text-3xl font-bold md:text-5xl">
                  {section.title}
                </h2>
                <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                  {section.description}
                </p>
                {section.buttons && (
                  <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                    {section.buttons.map((item, idx) => (
                      <Button
                        key={idx}
                        variant={item.variant || "glow"}
                        size="lg"
                      >
                        {item.url ? (
                          <Link
                            href={item.url}
                            target={item.target}
                            className="flex items-center justify-center gap-2"
                          >
                            {item.title}
                            {item.icon && (
                              <Icon name={item.icon as string} className="size-5" />
                            )}
                          </Link>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            {item.title}
                            {item.icon && (
                              <Icon name={item.icon as string} className="size-5" />
                            )}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}
