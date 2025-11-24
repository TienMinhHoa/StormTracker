'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_NEWS_IMAGE } from '../../utils/imageUtils';

type SafeBackgroundImageProps = {
  src: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export default function SafeBackgroundImage({ 
  src, 
  className = '', 
  style = {},
  children 
}: SafeBackgroundImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(src || DEFAULT_NEWS_IMAGE);

  useEffect(() => {
    if (!src || src.trim() === '') {
      setImageUrl(DEFAULT_NEWS_IMAGE);
      return;
    }

    // Test if image can be loaded
    const img = new Image();
    img.onload = () => {
      setImageUrl(src);
    };
    img.onerror = () => {
      setImageUrl(DEFAULT_NEWS_IMAGE);
    };
    img.src = src;
  }, [src]);

  return (
    <div
      className={className}
      style={{
        ...style,
        backgroundImage: `url(${imageUrl})`,
      }}
    >
      {children}
    </div>
  );
}



