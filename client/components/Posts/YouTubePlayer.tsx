import React from 'react';

interface YouTubePlayerProps {
  videoUrl: string;
  title?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoUrl, title }) => {
  // Extract video ID from YouTube URL (supports regular videos, shorts, and embed URLs)
  const getYouTubeVideoId = (url: string): string | null => {
    // Handle different YouTube URL formats:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/shorts/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    
    // Remove any query parameters for cleaner processing
    const cleanUrl = url.split('?')[0];
    
    // Regex patterns for different YouTube URL formats
    const patterns = [
      // Regular YouTube watch URLs
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      // YouTube short URLs
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // YouTube Shorts URLs
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      // YouTube embed URLs
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // General YouTube URL pattern
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    ];
    
    // Try each pattern until we find a match
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="my-6">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
          src={embedUrl}
          title={title || 'YouTube Video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default YouTubePlayer;