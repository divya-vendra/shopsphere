import { useState, useRef, useEffect } from 'react';

/**
 * LazyImage — viewport-aware image loader using IntersectionObserver.
 *
 * Why not just loading="lazy"?
 *   Native lazy loading defers until ~1200px above the viewport (browser decides).
 *   IntersectionObserver gives us precise control: we load 200px before entry,
 *   show a blur-up placeholder, and fade in the final image. This prevents
 *   the jarring layout shift and blank-image flash of native lazy loading.
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  placeholderColor = '#f3f4f6',
  rootMargin = '200px',
}) {
  const [loaded,   setLoaded]   = useState(false);
  const [inView,   setInView]   = useState(false);
  const [error,    setError]    = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src, rootMargin]);

  return (
    <div
      ref={imgRef}
      className={`overflow-hidden ${className}`}
      style={{ backgroundColor: placeholderColor }}
    >
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      {error && (
        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
          No image
        </div>
      )}
    </div>
  );
}
