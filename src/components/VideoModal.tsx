import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, ExternalLink, Play, Tv, ShieldAlert, Radio, AlertTriangle, RefreshCw, Film, Youtube, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoResult {
  title: string;
  videoId: string;
  url: string;
  thumbnail?: string;
  duration?: string;
  author?: string;
}

interface VideoModalProps {
  isOpen: boolean;
  videoQuery: string;
  videoTitle?: string;
  videoUrl?: string;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  videoQuery,
  videoTitle,
  videoUrl,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [customSearch, setCustomSearch] = useState('');
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [activeDirectUrl, setActiveDirectUrl] = useState<string>('');
  const [activeTitle, setActiveTitle] = useState<string>('');
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Extract YouTube ID if it's a direct URL or 11-char ID
  const extractYtId = (str: string): string | null => {
    if (!str) return null;
    const clean = str.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
    const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const isDirectVideoFile = (str: string): boolean => {
    return /\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(str.trim());
  };

  const loadQuery = async (query: string, preferredUrl?: string) => {
    setIsLoading(true);
    const target = query || 'cybersecurity and neural networks';
    setCustomSearch(target);

    // If explicit video URL was provided
    if (preferredUrl) {
      if (isDirectVideoFile(preferredUrl)) {
        setActiveDirectUrl(preferredUrl);
        setActiveVideoId('');
        setActiveTitle(videoTitle || 'Direct Video Stream');
        setIsLoading(false);
        return;
      }
      const directId = extractYtId(preferredUrl);
      if (directId) {
        setActiveVideoId(directId);
        setActiveDirectUrl('');
        setActiveTitle(videoTitle || target);
        setIsLoading(false);
        return;
      }
    }

    // Check if target is a direct YT link or ID
    const directId = extractYtId(target);
    if (directId) {
      setActiveVideoId(directId);
      setActiveDirectUrl('');
      setActiveTitle(videoTitle || target);
      setIsLoading(false);
      return;
    }

    if (isDirectVideoFile(target)) {
      setActiveDirectUrl(target);
      setActiveVideoId('');
      setActiveTitle(videoTitle || 'Direct Video Stream');
      setIsLoading(false);
      return;
    }

    // Search via backend yt-search
    try {
      const res = await fetch('/api/yt-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: target }),
      });
      const textData = await res.text();
      let data = {};
      try { data = JSON.parse(textData); } catch(e) { console.error("JSON parse error", e); }
      if (Array.isArray(data.result) && data.result.length > 0) {
        setSearchResults(data.result);
        setCurrentIndex(0);
        setActiveVideoId(data.result[0].videoId);
        setActiveDirectUrl('');
        setActiveTitle(data.result[0].title);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Video search failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQuery(videoQuery || 'Cybersecurity live stream', videoUrl);
    }
  }, [isOpen, videoQuery, videoUrl]);

  if (!isOpen) return null;

  const handleSelectVideo = (video: VideoResult, idx: number) => {
    setActiveVideoId(video.videoId);
    setActiveDirectUrl('');
    setActiveTitle(video.title);
    setCurrentIndex(idx);
  };

  const handleNextSource = () => {
    if (searchResults.length > 0) {
      const nextIdx = (currentIndex + 1) % searchResults.length;
      handleSelectVideo(searchResults[nextIdx], nextIdx);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`fixed z-50 transition-all duration-300 font-mono ${
          isMinimized 
            ? 'bottom-16 right-6 w-84 shadow-[0_0_30px_rgba(34,197,94,0.3)]' 
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-4xl max-h-[92vh] shadow-[0_0_50px_rgba(34,197,94,0.4)] flex flex-col'
        }`}
      >
        <div className="border-2 border-green-500 bg-black/95 text-green-400 backdrop-blur-md overflow-hidden relative flex flex-col max-h-[92vh]">
          {/* Cyber Top Scanline & Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-600 animate-pulse"></div>

          {/* Header Bar */}
          <div className="bg-green-950/60 border-b border-green-500/40 p-3 flex items-center justify-between gap-3 select-none shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-950/80 border border-red-500/60 text-red-400 text-[10px] uppercase font-bold tracking-widest animate-pulse shrink-0">
                <Radio className="w-3 h-3 text-red-500 animate-spin" />
                <span>LIVE FEED</span>
              </div>
              <Tv className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-xs font-bold text-green-300 truncate tracking-wider">
                {activeTitle || videoTitle || videoQuery || 'FEED_INTERCEPT_STREAM'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-green-500/20 border border-green-500/30 text-green-400 transition-colors"
                title={isMinimized ? "Maximize HUD" : "Minimize HUD"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              
              {activeVideoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:bg-green-500/20 border border-green-500/30 text-green-400 transition-colors hidden sm:flex items-center gap-1 text-[10px]"
                  title="Open in YouTube"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <button
                onClick={onClose}
                className="p-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 text-red-400 transition-colors"
                title="Terminate Stream (Close)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Video Player */}
          {!isMinimized && (
            <div className="flex flex-col flex-1 overflow-y-auto">
              {/* Telemetry Bar */}
              <div className="bg-black/90 px-4 py-1.5 border-b border-green-500/20 flex flex-wrap items-center justify-between text-[9px] text-green-500/70 shrink-0">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-green-400" />
                  <span>TARGET_STREAM // DECRYPTED_SIGNAL</span>
                </span>
                <div className="flex items-center gap-3">
                  {searchResults.length > 1 && (
                    <button
                      onClick={handleNextSource}
                      className="px-2 py-0.5 bg-green-950 border border-green-500/40 text-green-300 hover:bg-green-900 text-[9px] flex items-center gap-1 transition-colors uppercase"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Switch Stream ({currentIndex + 1}/{searchResults.length})</span>
                    </button>
                  )}
                  <span className="text-green-400 hidden sm:inline">RESOLUTION: 1080p_HUD</span>
                </div>
              </div>

              {/* Video Iframe / Player Container */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden shrink-0">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 text-green-400 p-6 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
                    <p className="text-xs tracking-widest uppercase animate-pulse">Decrypting & Intercepting Video Stream...</p>
                  </div>
                ) : activeDirectUrl ? (
                  <video
                    src={activeDirectUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : activeVideoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                    title="PRAGNA Video Stream HUD"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-green-500/60 p-6 text-center">
                    <AlertTriangle className="w-10 h-10 stroke-[1.5] text-yellow-500/80 animate-pulse" />
                    <p className="text-xs tracking-widest uppercase">No Active Stream Decoded</p>
                    <p className="text-[10px] text-green-600">Type a search query below or enter a YouTube URL.</p>
                  </div>
                )}
              </div>

              {/* Embed Fallback & External Link Bar */}
              {activeVideoId && (
                <div className="bg-green-950/30 border-b border-green-500/20 px-3 py-1.5 flex items-center justify-between text-[10px] text-green-400/80">
                  <span className="truncate pr-2">
                    Title: <strong className="text-green-300">{activeTitle}</strong>
                  </span>
                  <a
                    href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-yellow-400 hover:text-yellow-300 underline flex items-center gap-1"
                  >
                    <span>If blocked by YouTube, click to open directly</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Multiple Intercepted Feeds Grid */}
              {searchResults.length > 0 && (
                <div className="p-3 bg-black/95 border-b border-green-500/30">
                  <span className="text-[9px] uppercase tracking-widest text-green-600 block mb-2 font-bold">
                    &gt; INTERCEPTED_VIDEO_CHANNELS ({searchResults.length} AVAILABLE):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                    {searchResults.map((vid, idx) => (
                      <button
                        key={vid.videoId || idx}
                        onClick={() => handleSelectVideo(vid, idx)}
                        className={`flex items-start gap-2 p-1.5 text-left border transition-all ${
                          activeVideoId === vid.videoId
                            ? 'bg-green-900/40 border-green-400 text-green-200 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                            : 'bg-green-950/20 border-green-500/20 hover:border-green-500/50 text-green-400/80 hover:bg-green-950/40'
                        }`}
                      >
                        {vid.thumbnail ? (
                          <img
                            src={vid.thumbnail}
                            alt=""
                            className="w-16 h-10 object-cover border border-green-500/30 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-green-950 border border-green-500/30 flex items-center justify-center shrink-0">
                            <Film className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold truncate leading-tight">{vid.title}</p>
                          <div className="flex items-center gap-2 text-[8px] text-green-600 mt-1">
                            {vid.duration && <span>{vid.duration}</span>}
                            {vid.author && <span className="truncate">{vid.author}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search / Override Stream Input */}
              <div className="p-3 bg-black/90 flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-green-500/80 uppercase tracking-widest hidden sm:inline">&gt; OVERRIDE_FEED:</span>
                <input
                  type="text"
                  value={customSearch}
                  onChange={(e) => setCustomSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadQuery(customSearch);
                    }
                  }}
                  placeholder="Enter video query, song, or YouTube link..."
                  className="flex-1 bg-green-950/20 border border-green-500/40 px-3 py-1.5 text-xs text-green-300 placeholder:text-green-800 focus:outline-none focus:border-green-400"
                />
                <button
                  onClick={() => loadQuery(customSearch)}
                  className="px-3 py-1.5 bg-green-950/80 border border-green-500/60 text-green-400 hover:bg-green-900 text-xs flex items-center gap-1.5 transition-colors uppercase font-bold tracking-wider"
                >
                  <Play className="w-3 h-3 fill-green-400" />
                  <span>LOAD</span>
                </button>
              </div>
            </div>
          )}

          {/* Minimized Bar */}
          {isMinimized && (
            <div className="p-3 bg-black/90 flex items-center justify-between text-xs">
              <span className="truncate text-green-400/90 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                <span>{activeTitle || 'Stream running in background'}</span>
              </span>
              <button
                onClick={() => setIsMinimized(false)}
                className="px-2 py-0.5 bg-green-950 border border-green-500/40 text-green-400 hover:bg-green-900 text-[10px]"
              >
                EXPAND
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
