import { useState, useEffect, useRef } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/solid';

/**
 * Multi-Server Video Player Iframe Component
 * Supports:
 * - Server 1: MegaPlay (megaplay.buzz)
 * - Server 2: ZokoAnime (zokoanime.video)
 * - Server 3: VidLink (vidlink.pro)
 * - Server 4: AnimeEmbed (animeembed.com)
 *
 * Implements calibrated iframe sandboxing to block popup ads/new tabs
 * while preserving HLS video playback, MSE, Blob URLs, and container fullscreen.
 */
const VideoPlayer = ({
  malId,
  currentEpisode = 1,
  activeServer = 'server1',
  track = 'sub',
  autoSkip = true,
  autoNext = true,
  onEpisodeComplete,
  onProgress,
  onServerSwitch,
  isLightsOff = false,
  isTheater = false,
  containerRef,
}) => {
  const iframeRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Generate Stream URL based on Server Specification
  const getStreamUrl = () => {
    const ep = Math.max(1, parseInt(currentEpisode, 10) || 1);
    const id = parseInt(malId, 10);
    const lang = track === 'dub' ? 'dub' : 'sub';

    switch (activeServer) {
      case 'server1':
        // Server 1: MegaPlay (megaplay.buzz) - Primary / Default HLS
        return `https://megaplay.buzz/stream/mal/${id}/${ep}/${lang}`;

      case 'server2':
        // Server 2: ZokoAnime (zokoanime.video) - Auto-Skip & Custom Accent
        const asiParam = autoSkip ? 1 : 0;
        const autoNextParam = autoNext ? 1 : 0;
        return `https://zokoanime.video/stream/mal/${id}/${ep}/${track}?color=8B5CF6&autoplay=1&asi=${asiParam}&autonext=${autoNextParam}`;

      case 'server3':
        // Server 3: VidLink (vidlink.pro) - Fast, low-ad MAL stream with purple accent & sub/dub fallback
        return `https://vidlink.pro/anime/${id}/${ep}/${lang}?primaryColor=8B5CF6&fallback=true`;

      case 'server4':
        // Server 4: AnimeEmbed (animeembed.com) - Unbranded developer embed with custom accent
        return `https://animeembed.com/embed/mal/${id}/${ep}?track=${lang}&accent=8B5CF6`;

      default:
        return `https://megaplay.buzz/stream/mal/${id}/${ep}/${lang}`;
    }
  };

  const streamUrl = getStreamUrl();

  // Reset error state when episode or server changes
  useEffect(() => {
    setHasError(false);
    setErrorMessage('');
    setIframeKey((prev) => prev + 1);
  }, [malId, currentEpisode, activeServer, track]);

  // Fullscreen sync listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement === containerRef?.current;
      setIsFullscreen(active);

      // Report fullscreen state to ZokoAnime if active
      if (activeServer === 'server2' && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { channel: 'zokoanime', type: 'fullscreen', active },
          'https://zokoanime.video'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [activeServer, containerRef]);

  // Unified postMessage listener for Server 1, Server 2, Server 3 & Server 4
  useEffect(() => {
    const handleMessage = (event) => {
      const allowedOrigins = [
        'https://zokoanime.video',
        'https://megaplay.buzz',
        'https://vidlink.pro',
        'https://animeembed.com',
      ];
      if (!allowedOrigins.includes(event.origin)) return;

      let msg = event.data;
      if (typeof msg === 'string') {
        try {
          msg = JSON.parse(msg);
        } catch {
          return;
        }
      }
      if (!msg) return;

      // Handle Server 2 (ZokoAnime)
      if (msg.channel === 'zokoanime') {
        switch (msg.type) {
          case 'ready':
            if (iframeRef.current?.contentWindow) {
              const active = document.fullscreenElement === containerRef?.current;
              iframeRef.current.contentWindow.postMessage(
                { channel: 'zokoanime', type: 'fullscreen', active },
                'https://zokoanime.video'
              );
            }
            break;
          case 'watching-log':
            if (msg.currentTime !== undefined && msg.duration !== undefined) {
              onProgress?.(msg.currentTime, msg.duration);
            }
            break;
          case 'ended':
          case 'complete':
            onEpisodeComplete?.();
            break;
          case 'fullscreen':
            if (msg.request === 'enter') {
              containerRef?.current?.requestFullscreen?.();
            } else if (msg.request === 'exit') {
              document.exitFullscreen?.();
            }
            break;
          case 'error':
            console.warn('[ZokoAnime error]', msg);
            setHasError(true);
            setErrorMessage(msg.message || 'Stream temporarily unavailable on Server 2 (Zoko)');
            break;
          default:
            break;
        }
      }

      // Handle Server 1 (MegaPlay)
      if (msg.channel === 'megacloud' || msg.channel === 'megaplay') {
        if (msg.type === 'watching-log' || msg.event === 'time') {
          onProgress?.(msg.currentTime || msg.time, msg.duration);
        }
        if (msg.event === 'complete' || msg.type === 'complete') {
          onEpisodeComplete?.();
        }
        if (msg.event === 'error' || msg.type === 'error') {
          console.warn('[MegaPlay error]', msg);
          setHasError(true);
          setErrorMessage('Playback error reported on Server 1 (MegaPlay)');
        }
      }

      // Handle Server 4 (AnimeEmbed)
      if (msg.channel === 'animeembed') {
        if (msg.event === 'progress' && msg.data) {
          onProgress?.(msg.data.currentTime, msg.data.duration);
        }
        if (msg.event === 'ended') {
          onEpisodeComplete?.();
        }
        if (msg.event === 'error') {
          console.warn('[AnimeEmbed error]', msg);
          setHasError(true);
          setErrorMessage('Playback error reported on Server 4 (AnimeEmbed)');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [containerRef, onEpisodeComplete, onProgress]);

  const toggleContainerFullscreen = () => {
    if (!containerRef?.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  };

  const handleReload = () => {
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  };

  const serverLabels = {
    server1: 'Server 1 (MegaPlay)',
    server2: 'Server 2 (Zoko)',
    server3: 'Server 3 (VidLink)',
    server4: 'Server 4 (AnimeEmbed)',
  };

  const serverCycle = {
    server1: 'server3',
    server2: 'server3',
    server3: 'server4',
    server4: 'server1',
  };

  const alternateServer = serverCycle[activeServer] || 'server1';
  const alternateServerLabel = serverLabels[alternateServer] || 'Server 1 (MegaPlay)';

  const lightsClass = isLightsOff
    ? 'z-[70] shadow-[0_0_80px_rgba(139,92,246,0.55)] ring-1 ring-white/20'
    : '';

  const playerSizing = isTheater
    ? 'w-full max-h-[82vh] aspect-video mx-auto'
    : 'w-full aspect-video';

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${playerSizing} ${lightsClass}`}
    >
      {/* Failover Alert Banner */}
      {hasError && (
        <div className="absolute top-0 inset-x-0 z-30 bg-red-950/90 border-b border-red-800 text-white px-4 py-2.5 flex items-center justify-between text-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 shrink-0" />
            <span>
              {errorMessage || `Streaming error on ${serverLabels[activeServer] || activeServer}.`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReload}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white/10 hover:bg-white/20 rounded font-medium transition-colors"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Retry
            </button>
            <button
              onClick={() => onServerSwitch?.(alternateServer)}
              className="px-3 py-1 text-xs bg-primary hover:bg-primary/90 font-semibold rounded transition-colors"
            >
              Switch to {alternateServerLabel}
            </button>
          </div>
        </div>
      )}

      {/* Embedded Stream Iframe with Calibrated Sandbox Policy */}
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={streamUrl}
        title={`Episode ${currentEpisode} Player`}
        width="100%"
        height="100%"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        className="w-full h-full border-0 rounded-xl bg-black"
      />

      {/* Manual Fullscreen Trigger overlay button */}
      <button
        onClick={toggleContainerFullscreen}
        aria-label="Toggle Fullscreen"
        title="Toggle Fullscreen (F)"
        className="absolute bottom-3 right-3 z-20 p-2 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white rounded-lg backdrop-blur-md border border-white/10 transition-all opacity-0 hover:opacity-100 focus:opacity-100"
      >
        {isFullscreen ? (
          <ArrowsPointingInIcon className="w-5 h-5" />
        ) : (
          <ArrowsPointingOutIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default VideoPlayer;
