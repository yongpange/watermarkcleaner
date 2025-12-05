import { Badge } from "@/components/ui/badge";
import { Section as SectionType } from "@/types/blocks/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16">
      <div className="container">
        <div className="text-center">
          {section.label && (
            <Badge className="text-xs font-medium">{section.label}</Badge>
          )}
          <h2 className="mt-4 text-4xl font-semibold">{section.title}</h2>
          <p className="mt-6 font-medium text-muted-foreground">
            {section.description}
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-3xl">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {section.items?.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-lg border border-border bg-card px-6 data-[state=open]:bg-accent/50"
              >
                <AccordionTrigger className="py-6 hover:no-underline">
                  <div className="flex items-center gap-x-4 text-left">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-base font-semibold leading-7">
                      {item.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-2">
                  <p className="text-base leading-7 text-muted-foreground pl-12">
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
