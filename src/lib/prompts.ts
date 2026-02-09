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
  restore: {
    zh: "专业修复这张老照片：1) 去除表面划痕、破损、污渍和斑点；2) 修复褪色和变色区域，恢复原始色彩平衡；3) 增强面部细节和清晰度，让五官更加鲜明；4) 为黑白照片添加自然的色彩还原，符合照片年代特征；5) 提升整体对比度和锐度，让照片焕发新生。",
    en: "Professionally restore this old photo: 1) Remove surface scratches, tears, stains and spots; 2) Fix faded and discolored areas, restore original color balance; 3) Enhance facial details and clarity, make features more distinct; 4) Add natural color restoration for black & white photos, matching the era characteristics; 5) Improve overall contrast and sharpness to bring the photo back to life.",
  },
  enhance: {
    zh: "增强这张照片的整体质量。改善光照、颜色平衡和对比度。",
    en: "Enhance the overall quality of this photo. Improve lighting, color balance, and contrast.",
  },
  denoise: {
    zh: "专业去除这张图片中的数字噪点、颗粒感和色彩斑点，同时精细保留图像边缘、纹理细节和重要特征。让照片变得干净平滑、清晰自然，适用于夜景、高ISO照片和手机拍摄的噪点图片。",
    en: "Professionally remove digital noise, grain, and color speckles from this image while carefully preserving edges, textures, and important details. Make the photo clean, smooth, and naturally clear. Perfect for night shots, high-ISO photos, and noisy mobile images.",
  },
  "remove-background": {
    zh: "专业移除这张图片的背景，将主体与背景完全分离。使用AI智能识别技术精确检测前景物体边缘，生成干净的透明背景PNG图像。保留主体的所有细节、边缘清晰度和自然轮廓，适用于人像、产品、动物等各种类型的图片。",
    en: "Professionally remove the background from this image, completely separating the subject from the background. Use AI intelligent recognition technology to accurately detect foreground object edges and generate clean transparent background PNG images. Preserve all details of the subject, edge clarity, and natural contours. Suitable for portraits, products, animals, and various types of images."
  },
  "blur-background": {
    zh: "对这张图片的背景应用专业虚化效果，同时保持主体清晰锐利。创建美丽的散景(bokeh)效果，让人像或产品更加突出。智能识别前景主体，精确处理边缘过渡，模拟大光圈相机的浅景深效果。适用于人像摄影、产品展示和专业头像。",
    en: "Apply professional blur effect to the background of this image while keeping the subject sharp and clear. Create beautiful bokeh effect to make portraits or products stand out. Intelligently recognize foreground subjects, precisely handle edge transitions, simulating the shallow depth of field effect of large aperture cameras. Suitable for portrait photography, product display, and professional headshots."
  },
  colorize: {
    zh: "为这张黑白照片添加自然真实的色彩。根据照片内容、年代特征和场景上下文智能分析并还原最符合历史背景的颜色。为人物肤色、服装、建筑、风景等元素赋予准确且富有年代感的色彩，让老照片焕发新生，同时保留原始照片的细节和质感。",
    en: "Add natural and realistic colors to this black and white photo. Intelligently analyze the photo content, era characteristics, and scene context to restore the most historically accurate colors. Give accurate and era-appropriate colors to skin tones, clothing, buildings, landscapes and other elements, bringing old photos back to life while preserving the original details and textures."
  },
  upscale: {
    zh: "专业放大这张图片，将其提升到更高分辨率而不损失质量。使用AI超分辨率技术智能增强细节、纹理和边缘，消除锯齿和模糊。保持原始图像的自然外观，同时增加清晰度和锐度。适用于小尺寸图片、压缩图片、网络图片和需要打印的大图输出。",
    en: "Professionally upscale this image to a higher resolution without losing quality. Use AI super-resolution technology to intelligently enhance details, textures, and edges while eliminating jaggies and blur. Maintain the natural appearance of the original image while increasing clarity and sharpness. Perfect for small images, compressed photos, web images, and print-ready large format output."
  }
};

export type FeatureType = keyof typeof FEATURE_PROMPTS;

export function getFeaturePrompt(feature: string, lang: 'zh' | 'en' = 'en'): string {
  const featureKey = (feature in FEATURE_PROMPTS ? feature : 'watermark') as FeatureType;
  return FEATURE_PROMPTS[featureKey][lang] || FEATURE_PROMPTS[featureKey]['en'];
}
