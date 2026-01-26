export const FEATURE_PROMPTS = {
  // Default watermark removal (existing)
  watermark: {
    zh: "移除图片中的所有水印、文字覆盖层、logo和版权标记。使用上下文感知修复技术无缝恢复原始背景。保持原始图像质量、颜色和纹理。让结果看起来像从未添加过水印。",
    en: "Remove all watermarks, text overlays, logos, and copyright marks from this image. Restore the original background seamlessly using context-aware inpainting. Maintain the original image quality, colors, and textures. Make the result look as if no watermark was ever present.",
  },

  // New Image Unblur feature
  unblur: {
    zh: "修复这张模糊的图片，使其变得清晰锐利。增强细节、边缘和纹理，同时保持自然的外观。消除运动模糊和散焦模糊，提高整体图像质量。",
    en: "Fix this blurry image and make it clear and sharp. Enhance details, edges, and textures while maintaining a natural look. Remove motion blur and defocus blur, improving overall image quality.",
  },

  // Future features (placeholders)
  upscale: {
    zh: "将此图像放大而不损失质量。增强细节并保持清晰度。",
    en: "Upscale this image without losing quality. Enhance details and maintain sharpness.",
  },
  restore: {
    zh: "修复这张老照片。去除划痕、破损和斑点。增强面部细节并恢复某些颜色。",
    en: "Restore this old photo. Remove scratches, tears, and spots. Enhance facial details and recover some color.",
  },
  enhance: {
    zh: "增强这张照片的整体质量。改善光照、颜色平衡和对比度。",
    en: "Enhance the overall quality of this photo. Improve lighting, color balance, and contrast.",
  }
};

export type FeatureType = keyof typeof FEATURE_PROMPTS;

export function getFeaturePrompt(feature: string, lang: 'zh' | 'en' = 'en'): string {
  const featureKey = (feature in FEATURE_PROMPTS ? feature : 'watermark') as FeatureType;
  return FEATURE_PROMPTS[featureKey][lang] || FEATURE_PROMPTS[featureKey]['en'];
}
