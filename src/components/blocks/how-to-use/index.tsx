import { Section as SectionType } from "@/types/blocks/section";
import { FadeIn } from "@/components/motion/FadeIn";

export default function HowToUse({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const steps = section.items ?? [];

  return (
    <section id={section.name} className="py-16 lg:py-24 overflow-hidden">
      <div className="container">
        <div className="text-center mb-14">
          {section.label && (
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {section.label}
            </span>
          )}
          <h2 className="font-display text-3xl font-bold lg:text-4xl mb-4">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
              {section.description}
            </p>
          )}
        </div>

        {/* Steps */}
        {steps.length > 0 && (
          <div className="relative max-w-6xl mx-auto">
            {/* Connecting gradient line */}
            <div className="hidden lg:block absolute top-[2.25rem] left-[12.5%] right-[12.5%] h-px">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
              {steps.map((item, index) => (
                <FadeIn
                  key={index}
                  delay={index * 0.12}
                  direction="up"
                  distance={24}
                  className="flex flex-col items-center text-center"
                >
                  {/* Step Number Badge */}
                  <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card shadow-md transition-transform duration-300 hover:scale-105">
                    <span className="font-mono text-2xl font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                    {item.description}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
