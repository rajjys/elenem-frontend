import { cn } from '@/utils/cn';

type Props = {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  alt: string;
  /** Below the fold: load it when the visitor scrolls near it. */
  lazy?: boolean;
  className?: string;
};

/**
 * A capture of a phone's screen, in a drawn phone (the landing's hero and modules). The frame is
 * on tokens, so it follows the theme; the capture stays what the phone showed.
 *
 * Its corners are in percent — of the width, then of the height, so they stay round on a screen
 * about 2.15 times taller than wide. A fixed radius ate the status bar's clock on a small phone.
 */
export function PhoneScreen({ lazy, className, alt, ...img }: Props) {
  return (
    <div className={cn('rounded-[9.3%/4.4%] border border-line-strong bg-elevated p-1 shadow-e2 sm:p-1.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- already sized and compressed; see hero-screens.tsx */}
      <img
        {...img}
        alt={alt}
        loading={lazy ? 'lazy' : undefined}
        decoding="async"
        className="h-auto w-full rounded-[7%/3.25%]"
      />
    </div>
  );
}
