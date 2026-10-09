"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import AutoScroll from "embla-carousel-auto-scroll";
import { Card } from "@/components/ui/card";
import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";
import { Star } from "lucide-react";
import { useRef } from "react";
import { FadeIn } from "@/components/motion/FadeIn";

export default function Testimonial({ section }: { section: SectionType }) {
  const plugin = useRef(
    AutoScroll({
      startDelay: 500,
      speed: 0.7,
    })
  );

  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className="py-16">
      <div className="container">
        <FadeIn className="flex flex-col items-center gap-4 text-center">
          {section.label && (
            <div className="flex items-center gap-2 font-mono text-sm font-medium uppercase tracking-wider text-primary">
              {section.icon && (
                <Icon name={section.icon} className="h-5 w-auto" />
              )}
              {section.label}
            </div>
          )}
          <h2 className="font-display text-3xl font-semibold lg:text-4xl">
            {section.title}
          </h2>
          <p className="max-w-2xl text-muted-foreground lg:text-lg">
            {section.description}
          </p>
        </FadeIn>
      </div>
      <div className="lg:container">
        <div className="mt-14 space-y-4">
          <Carousel
            opts={{
              loop: true,
            }}
            plugins={[plugin.current]}
            onMouseEnter={() => plugin.current.stop()}
            onMouseLeave={() => plugin.current.play()}
            className="relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-10 before:w-36 before:bg-linear-to-r before:from-background before:to-transparent after:absolute after:bottom-0 after:right-0 after:top-0 after:z-10 after:w-36 after:bg-linear-to-l after:from-background after:to-transparent"
          >
            <CarouselContent>
              {section.items?.map((item, index) => (
                <CarouselItem key={index} className="basis-auto">
                  <Card className="glass max-w-96 select-none border-0 p-6 shadow transition-shadow duration-300 hover:shadow-md">
                    <div className="flex justify-between gap-4">
                      <div className="mb-4 flex gap-4">
                        <Avatar className="size-14 rounded-full ring-1 ring-border">
                          <AvatarImage
                            src={item.image?.src}
                            alt={item.image?.alt || item.title}
                          />
                        </Avatar>
                        <div>
                          <p className="font-display font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="size-4 fill-amber-400/90 text-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                    <q className="block leading-7 text-muted-foreground">
                      {item.description}
                    </q>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
