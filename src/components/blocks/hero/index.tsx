import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { RiUploadCloud2Line, RiImageLine } from "react-icons/ri";

export default function Hero({ hero }: { hero: HeroType }) {
  if (hero.disabled) {
    return null;
  }

  const highlightText = hero.highlight_text;
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  return (
    <>
      <HeroBg />
      <section className="py-12 lg:py-20">
        <div className="container">
          <div className="text-center">
            {hero.announcement && (
              <Link
                href={hero.announcement.url}
                className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm transition-colors hover:bg-primary/10"
              >
                {hero.announcement.label && (
                  <Badge className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
                    {hero.announcement.label}
                  </Badge>
                )}
                <span className="text-muted-foreground">{hero.announcement.title}</span>
              </Link>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="mx-auto mb-4 mt-4 max-w-4xl text-balance text-3xl font-bold lg:mb-6 lg:text-6xl">
                {texts[0]}
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {highlightText}
                </span>
                {texts[1]}
              </h1>
            ) : (
              <h1 className="mx-auto mb-4 mt-4 max-w-4xl text-balance text-3xl font-bold lg:mb-6 lg:text-6xl">
                {hero.title}
              </h1>
            )}

            <p
              className="mx-auto max-w-2xl text-muted-foreground text-base lg:text-lg mb-8"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />

            {/* Upload Area - Key Feature */}
            <div className="mx-auto max-w-2xl mb-8">
              <Link href="/convert" className="block">
                <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-violet-50/30 dark:to-violet-950/10 p-8 lg:p-12 transition-all duration-300 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                      <RiUploadCloud2Line className="w-8 h-8 lg:w-10 lg:h-10" />
                    </div>

                    <div className="text-center">
                      <p className="text-lg lg:text-xl font-semibold text-foreground mb-1">
                        Click or drag image here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports JPG, PNG, WebP, BMP (Max 20MB)
                      </p>
                    </div>

                    <Button
                      size="lg"
                      className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 px-8 py-6 text-lg font-semibold"
                    >
                      <RiImageLine className="w-5 h-5 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              </Link>
            </div>

            {hero.tip && (
              <p className="text-sm text-muted-foreground mb-6">{hero.tip}</p>
            )}

            {/* Before/After Comparison Preview */}
            <div className="mx-auto max-w-4xl mt-12 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="relative group rounded-xl overflow-hidden shadow-lg border border-border/50">
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="secondary" className="bg-red-500/90 text-white border-0 backdrop-blur-sm">
                      Before
                    </Badge>
                  </div>
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="w-24 h-24 mx-auto mb-3 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center relative">
                        <RiImageLine className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-red-500 bg-white/80 px-2 py-0.5 rounded transform rotate-[-15deg]">
                            WATERMARK
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Image with watermark</p>
                    </div>
                  </div>
                </div>

                <div className="relative group rounded-xl overflow-hidden shadow-lg border border-border/50">
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm">
                      After
                    </Badge>
                  </div>
                  <div className="aspect-[4/3] bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="w-24 h-24 mx-auto mb-3 rounded-lg bg-gradient-to-br from-violet-200 to-indigo-200 dark:from-violet-800 dark:to-indigo-800 flex items-center justify-center">
                        <RiImageLine className="w-10 h-10 text-violet-600 dark:text-violet-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">Clean, watermark-free image</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {hero.show_happy_users && <HappyUsers />}
          </div>
        </div>
      </section>
    </>
  );
}
