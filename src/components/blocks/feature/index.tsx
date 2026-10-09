import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/StaggerContainer";

export default function Feature({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16 lg:py-24">
      <div className="container">
        <div className="mx-auto flex max-w-(--breakpoint-md) flex-col items-center gap-2 text-center">
          <h2 className="font-display mb-2 text-pretty text-3xl font-bold lg:text-4xl">
            {section.title}
          </h2>
          <p className="mb-8 max-w-xl text-muted-foreground lg:max-w-none lg:text-lg">
            {section.description}
          </p>
        </div>

        <StaggerContainer
          stagger={0.08}
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {section.items?.map((item, i) => {
            const isHero = i === 0;

            return (
              <StaggerItem
                key={i}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-gradient lg:p-8 ${
                  isHero ? "md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div className="relative z-10">
                  {item.icon && (
                    <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary lg:size-16">
                      <Icon name={item.icon} className="size-7 lg:size-8" />
                    </div>
                  )}
                  <h3 className="mb-2 font-display text-xl font-semibold lg:text-2xl">
                    {item.title}
                  </h3>
                  <p className="max-w-prose text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Subtle primary glow on hover */}
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 glow" />
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
