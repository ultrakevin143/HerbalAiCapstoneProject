import Image, { type ImageProps } from 'next/image';

interface OptimizedFillImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  onError?: ImageProps['onError'];
}

const optimizedHosts = new Set([
  'res.cloudinary.com',
  'images.unsplash.com',
  'lh3.googleusercontent.com',
]);

const canOptimize = (src: string) => {
  if (src.startsWith('/')) return true;
  try {
    return optimizedHosts.has(new URL(src).hostname);
  } catch {
    return false;
  }
};

export default function OptimizedFillImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
  onError,
}: OptimizedFillImageProps) {
  if (canOptimize(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        onError={onError}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={onError}
    />
  );
}
