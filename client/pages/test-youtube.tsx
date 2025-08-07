import React from 'react';
import YouTubePlayer from '../components/Posts/YouTubePlayer';

const TestYouTube = () => {
  return (
    <div>
      <h1>Test YouTube Embed</h1>
      <YouTubePlayer videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ" />
    </div>
  );
};

export default TestYouTube;