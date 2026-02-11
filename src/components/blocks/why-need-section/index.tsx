import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function WhyNeedSection({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16 lg:py-24">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          {section.label && (
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {section.label}
            </span>
          )}
          <h2 className="text-3xl font-bold lg:text-4xl mb-6">
            {section.title}
          </h2>
          {section.description && (
            <p
              className="text-muted-foreground text-base lg:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.description }}
            />
          )}
        </div>

        {/* Advantage Points */}
        {section.items && section.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
            {section.items.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                {item.icon && (
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <Icon name={item.icon} className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
