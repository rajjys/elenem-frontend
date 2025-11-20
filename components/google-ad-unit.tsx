import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface GoogleAdUnitProps {
  /** The Client ID (ca-pub-xxxxxxxx) - Optional if set globally in layout */
  publisherId?: string;
  /** The specific Ad Slot ID created in AdSense dashboard */
  slotId: string;
  /** Layout format: 'auto', 'fluid', 'rectangle' etc. */
  format?: 'auto' | 'fluid' | 'rectangle' | string;
  /** Is the ad responsive? */
  responsive?: boolean;
  /** Custom CSS styles */
  style?: React.CSSProperties;
  /** Class names for the container */
  className?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle: any[];
  }
}

const GoogleAdUnit = ({
  publisherId,
  slotId,
  format = 'auto',
  responsive = true,
  style = { display: 'block' },
  className = '',
}: GoogleAdUnitProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adRef = useRef<HTMLModElement>(null);
  // Used to force a re-render of the ad slot on route change
  const [key, setKey] = useState(0); 

  // When route changes, increment key to force React to remount the ad div
  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [pathname, searchParams]);

  useEffect(() => {
    try {
      // Check if ad slot is actually in the DOM and empty
      if (adRef.current && adRef.current.innerHTML === '') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [key]); // Re-run this push when key changes

  // Development guard: AdSense doesn't show on localhost usually, 
  // but showing a placeholder helps with layout design.
  if (process.env.NODE_ENV === 'development') {
    return (
      <div 
        className={`bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 ${className}`}
        style={{ ...style, minHeight: '250px', width: '100%' }}
      >
        Dev Mode: Ad Unit {slotId}
      </div>
    );
  }

  return (
    <div key={key} className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={publisherId || process.env.NEXT_PUBLIC_ADSENSE_ID} 
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default GoogleAdUnit;