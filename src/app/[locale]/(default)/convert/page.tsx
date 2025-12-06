import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import WatermarkEditor from "@/components/watermark-editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations();

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://watermarkcleaner.com";
  const canonicalUrl = locale === "en" ? `${baseUrl}/convert` : `${baseUrl}/${locale}/convert`;

  const title = locale === "zh" 
    ? "去水印编辑器 - 在线AI去水印工具 | WatermarkCleaner"
    : "Watermark Remover Editor - Online AI Watermark Removal | WatermarkCleaner";
  
  const description = locale === "zh"
    ? "使用我们的AI驱动编辑器轻松去除图片水印。上传图片，标记水印区域，一键去除。免费、快速、无需注册。"
    : "Remove watermarks from images easily with our AI-powered editor. Upload your image, mark the watermark area, and remove it with one click. Free, fast, and no sign-up required.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "WatermarkCleaner",
      type: "website",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ConvertPage() {
  return (
    <section className="py-8 lg:py-12">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Remove Watermarks
            </span>{" "}
            from Your Photos
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your image, mark the watermark area with our drawing tools, and let AI do the magic.
            Get clean, professional-looking photos in seconds.
          </p>
        </div>

        {/* Editor */}
        <WatermarkEditor />

        {/* Tips Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Tips for Best Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-medium mb-1">Be Precise</h3>
              <p className="text-sm text-muted-foreground">
                Mark only the watermark area. The less you select, the better the result.
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="text-2xl mb-2">🖌️</div>
              <h3 className="font-medium mb-1">Use the Right Tool</h3>
              <p className="text-sm text-muted-foreground">
                Use brush for irregular shapes, rectangle for logos, lasso for complex areas.
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="text-2xl mb-2">📐</div>
              <h3 className="font-medium mb-1">Adjust Brush Size</h3>
              <p className="text-sm text-muted-foreground">
                Use a smaller brush for fine details and larger brush for big watermarks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

