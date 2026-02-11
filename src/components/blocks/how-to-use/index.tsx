import { Section as SectionType } from "@/types/blocks/section";

export default function HowToUse({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16 lg:py-24">
      <div className="container">
        <div className="text-center mb-14">
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

        {/* Steps */}
        {section.items && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {section.items.map((item, index) => (
              <div key={index} className="relative flex flex-col items-center text-center group">
                {/* Connector Line (hidden on last item and mobile) */}
                {index < section.items!.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-primary/40 to-primary/10" />
                )}

                {/* Step Number */}
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-2xl font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>

                {/* Content */}
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
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
