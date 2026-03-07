import { useEffect, useState } from 'react';
import { subscribeToGlobalLoading } from '../../utils/loadingTracker';

const GlobalLoader = ({
  forceVisible = false,
  message = 'Loading data',
  subMessage = 'Please wait while the latest data arrives.',
  backdropClassName = 'bg-black/60 backdrop-blur-sm'
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalLoading(({ isLoading: nextLoading }) => {
      setIsLoading(nextLoading);
    });

    return unsubscribe;
  }, []);

  if (!forceVisible && !isLoading) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${backdropClassName}`}>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#101010]/90 px-8 py-7 shadow-2xl">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-lime-400/20 border-t-lime-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-emerald-400/10 border-b-emerald-400 animate-spin [animation-direction:reverse] [animation-duration:1.2s]" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-white">{message}</p>
          <p className="text-sm text-gray-300">{subMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;