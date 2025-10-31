'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
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

const DEFAULT_FALLBACK = '/images/default-placeholder.png';

// Keep this in sync with next.config.js remotePatterns hostnames.
const ALLOWED_REMOTE_HOSTS = new Set([
  'via.placeholder.com',
  'images.unsplash.com',
  'picsum.photos',
  'source.unsplash.com',
  'cdn.pixabay.com',
  'images.pexels.com',
  'res.cloudinary.com',
  'ipfs.io',
  'gateway.pinata.cloud',
]);

function sanitizeSrc(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  if (value.startsWith('/')) {
    return value;
  }

  if (value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);

      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return url.pathname && url.pathname !== '/' ? url.pathname : fallback;
      }

      if (ALLOWED_REMOTE_HOSTS.has(url.hostname)) {
        return value;
      }
    } catch {
      // Fall through to fallback.
    }

    return fallback;
  }

  return fallback;
}

export default function SafeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  sizes,
  fallbackSrc = DEFAULT_FALLBACK,
}: SafeImageProps) {
  const resolvedFallback = useMemo(
    () => sanitizeSrc(fallbackSrc, DEFAULT_FALLBACK),
    [fallbackSrc],
  );

  const [imgSrc, setImgSrc] = useState(() => sanitizeSrc(src, resolvedFallback));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const sanitized = sanitizeSrc(src, resolvedFallback);
    setHasError(false);
    setImgSrc(sanitized);
  }, [src, resolvedFallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(resolvedFallback);
    }
  };

  if (hasError && imgSrc === resolvedFallback) {
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
