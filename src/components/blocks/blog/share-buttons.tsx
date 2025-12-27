"use client";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const shareOnTwitter = () => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, '_blank');
  };

  const shareOnFacebook = () => {
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link');
    }
  };

  return (
    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Share Article</h3>
      <div className="flex gap-2">
        <button
          onClick={shareOnTwitter}
          className="flex-1 px-3 py-2 bg-[#1DA1F2] text-white rounded text-sm hover:bg-[#1DA1F2]/90 transition-colors"
        >
          Twitter
        </button>
        <button
          onClick={shareOnFacebook}
          className="flex-1 px-3 py-2 bg-[#1877F2] text-white rounded text-sm hover:bg-[#1877F2]/90 transition-colors"
        >
          Facebook
        </button>
      </div>
      <button
        onClick={copyLink}
        className="w-full px-3 py-2 bg-muted text-foreground rounded text-sm hover:bg-muted/80 transition-colors"
      >
          Copy Link
        </button>
    </div>
  );
}