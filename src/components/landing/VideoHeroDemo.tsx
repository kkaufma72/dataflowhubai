import React, { useState } from 'react';
import { Play, Volume2, VolumeX, Maximize2, X } from 'lucide-react';

interface VideoHeroDemoProps {
  videoUrl?: string; // YouTube embed URL or video file URL
  thumbnailUrl?: string;
  title?: string;
  className?: string;
}

export const VideoHeroDemo: React.FC<VideoHeroDemoProps> = ({
  videoUrl = '', // Will be empty until you record the video
  thumbnailUrl = '/demo-thumbnail.jpg',
  title = 'Watch DataFlowHub in Action',
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // If no video URL yet, show placeholder with instructions
  const hasVideo = videoUrl && videoUrl.length > 0;

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
  };

  // Placeholder view (shown until you record the video)
  if (!hasVideo) {
    return (
      <div className={`relative ${className}`}>
        {/* Placeholder Demo */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
          {/* Fake Browser Window */}
          <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 ml-4">
              <div className="bg-gray-700 rounded px-3 py-1 text-xs text-gray-400">
                app.dataflowhub.ai
              </div>
            </div>
          </div>

          {/* Demo Content */}
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-12 relative">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
                                  radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)`
              }}></div>
            </div>

            {/* Play Button Overlay */}
            <div className="relative z-10 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full border-4 border-white/20 hover:bg-white/20 transition-all cursor-not-allowed group">
                  <Play className="w-10 h-10 text-white ml-2" />
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-3">
                Demo Video Coming Soon!
              </h3>
              <p className="text-xl text-white/80 mb-6 max-w-lg">
                See DataFlowHub transform raw data into deployed ML models in under 3 minutes
              </p>

              {/* Instructions for Kyle */}
              <div className="bg-amber-500/20 border-2 border-amber-500/50 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-amber-200 font-medium mb-2">
                  📹 <strong>To add your video:</strong>
                </p>
                <ol className="text-xs text-amber-100 space-y-1 list-decimal list-inside">
                  <li>Record using script in <code className="bg-black/30 px-1 rounded">DEMO_VIDEO_SCRIPT.md</code></li>
                  <li>Upload to YouTube (Public or Unlisted)</li>
                  <li>Get embed URL (Share → Embed → Copy URL)</li>
                  <li>Update this component's <code className="bg-black/30 px-1 rounded">videoUrl</code> prop</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Feature Highlights Below */}
          <div className="bg-gray-900/50 backdrop-blur-sm px-6 py-4 grid grid-cols-3 gap-4 border-t border-white/10">
            {[
              { label: 'Upload Data', time: '0:20' },
              { label: 'AI Analysis', time: '1:30' },
              { label: 'Deploy Model', time: '2:40' }
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs text-gray-400 mb-1">{step.time}</p>
                <p className="text-sm font-semibold text-white">{step.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Below Video */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-indigo-600">3 min</p>
            <p className="text-sm text-gray-600">Demo Length</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">No Code</p>
            <p className="text-sm text-gray-600">Required</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">100%</p>
            <p className="text-sm text-gray-600">Automated</p>
          </div>
        </div>
      </div>
    );
  }

  // Real video player (shown once you add videoUrl)
  return (
    <div className={`relative ${className}`}>
      {!isPlaying ? (
        // Video Thumbnail with Play Button
        <button
          onClick={handlePlay}
          className="relative group w-full"
        >
          <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
            {/* Browser Chrome */}
            <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 ml-4">
                <div className="bg-gray-700 rounded px-3 py-1 text-xs text-gray-400">
                  app.dataflowhub.ai
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="aspect-video relative overflow-hidden">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Pulse Effect */}
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                  
                  {/* Play Button */}
                  <div className="relative inline-flex items-center justify-center w-24 h-24 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl group-hover:bg-white group-hover:scale-110 transition-all">
                    <Play className="w-10 h-10 text-indigo-600 ml-2" />
                  </div>
                </div>
              </div>

              {/* Video Duration Badge */}
              <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full">
                <p className="text-white text-sm font-bold">3:00</p>
              </div>
            </div>
          </div>

          {/* Title Below */}
          <p className="mt-4 text-lg font-semibold text-gray-700 text-center group-hover:text-indigo-600 transition-colors">
            {title}
          </p>
        </button>
      ) : (
        // Video Player (Fullscreen Modal)
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Video Container */}
            <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
              <div className="aspect-video">
                {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                  // YouTube Embed
                  <iframe
                    src={`${videoUrl}?autoplay=1&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                ) : (
                  // Direct Video File
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    muted={isMuted}
                    className="w-full h-full"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Below Video */}
      {!isPlaying && hasVideo && (
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-indigo-600">3 min</p>
            <p className="text-sm text-gray-600">Complete Demo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">No Code</p>
            <p className="text-sm text-gray-600">Required</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">Live API</p>
            <p className="text-sm text-gray-600">In Minutes</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoHeroDemo;
