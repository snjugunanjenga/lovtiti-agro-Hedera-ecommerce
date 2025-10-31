'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  fallbackSrc?: string;
}

const FALLBACK_UNSPLASH =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center';

function sanitizeSrc(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  // Handle absolute URLs pointing to localhost (or any http(s) scheme)
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        // Try to use the relative pathname if it exists, otherwise fall back
        return url.pathname && url.pathname !== '/' ? url.pathname : fallback;
      }
    } catch {
      return fallback;
    }
  }

  return value;
}

export default function SafeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  sizes,
  fallbackSrc = FALLBACK_UNSPLASH,
}: SafeImageProps) {
  const initialSrc = sanitizeSrc(src, fallbackSrc);
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const sanitized = sanitizeSrc(src, fallbackSrc);
    setHasError(false);
    setImgSrc(sanitized);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  if (hasError && imgSrc === fallbackSrc) {
    // If even the fallback fails, show a placeholder
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <Package className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  const imageProps = {
    src: imgSrc,
    alt,
    className,
    onError: handleError,
    ...(sizes && { sizes }),
  };

  if (fill) {
    return <Image {...imageProps} fill />;
  }

  return (
    <Image
      {...imageProps}
      width={width || 400}
      height={height || 300}
    />
  );
}
