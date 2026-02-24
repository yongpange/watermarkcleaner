/**
 * 示例图片配置
 * 用于首页 "试试示例" 功能
 * before: 带水印的原图（展示给用户 + 作为处理前预览）
 * after: 去水印后的结果图（模拟 API 返回）
 */
export interface SampleImage {
  id: string;
  before: string;
  after: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'beach',
    before: '/images/custom/beach_watermarked.webp',
    after: '/images/custom/beach.webp',
  },
  {
    id: 'woman_city',
    before: '/images/custom/woman_city_watermarked.webp',
    after: '/images/custom/woman_city.webp',
  },
  {
    id: 'stylish_woman',
    before: '/images/custom/stylish_woman_watermarked.webp',
    after: '/images/custom/stylish_woman.webp',
  },
];

/**
 * 根据 ID 获取示例图片配置
 */
export function getSampleImageById(id: string): SampleImage | undefined {
  return SAMPLE_IMAGES.find((img) => img.id === id);
}
