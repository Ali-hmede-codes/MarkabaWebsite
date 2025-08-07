import React from 'react';
import YouTubePlayer from '../components/Posts/YouTubePlayer';

const TestYouTube = () => {
  const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>YouTube Embed Test</h1>
      <p>Testing YouTube video embedding with updated CSP configuration:</p>
      <div style={{ marginTop: '20px' }}>
        <YouTubePlayer videoUrl={testVideoUrl} />
      </div>
      <p style={{ marginTop: '20px' }}>If you see the video above without CSP errors, the configuration is working correctly.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Test URLs:</h3>
        <p>Regular: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
        <p>Short: https://youtu.be/dQw4w9WgXcQ</p>
        <p>Shorts: https://www.youtube.com/shorts/dQw4w9WgXcQ</p>
      </div>
    </div>
  );
};

export default TestYouTube;