import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function FormatSpecs({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16 lg:py-24">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          {section.label && (
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {section.label}
            </span>
          )}
          <h2 className="text-3xl font-bold lg:text-4xl mb-4">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
              {section.description}
            </p>
          )}
        </div>

        {/* Format Cards */}
        {section.items && section.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-8 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all text-center"
              >
                {item.icon && (
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-5">
                    <Icon name={item.icon} className="w-7 h-7 text-primary" />
                  </div>
                )}
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                {item.label && (
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                    {item.label}
                  </span>
                )}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
