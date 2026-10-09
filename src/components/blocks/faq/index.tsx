import { Section as SectionType } from "@/types/blocks/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeIn } from "@/components/motion/FadeIn";

export default function FAQ({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16">
      <div className="container">
        <FadeIn className="text-center">
          {section.label && (
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider">
              {section.label}
            </span>
          )}
          <h2 className="mt-4 font-display text-4xl font-semibold">
            {section.title}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl font-medium text-muted-foreground">
            {section.description}
          </p>
        </FadeIn>
        <div className="mx-auto mt-14 max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {section.items?.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-border bg-card px-6 shadow-sm transition-colors data-[state=open]:bg-primary/[0.03]"
              >
                <AccordionTrigger className="py-6 hover:no-underline">
                  <div className="flex items-center gap-x-4 text-left">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-lg font-semibold leading-snug text-foreground">
                      {item.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-0">
                  <p className="pl-10 text-base leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
