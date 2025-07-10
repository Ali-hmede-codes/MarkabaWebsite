// Simple test to check social media data in browser console
// Run this in browser console on http://localhost:3000

const testSocialMedia = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/v2/social-media');
    const data = await response.json();
    
    console.log('=== SOCIAL MEDIA TEST ===');
    console.log('Response:', data);
    console.log('Success:', data.success);
    console.log('Data array:', data.data);
    console.log('Data length:', data.data?.length);
    
    if (data.data && data.data.length > 0) {
      console.log('\n=== ACTIVE SOCIAL MEDIA ===');
      const activeLinks = data.data.filter(link => Boolean(link.is_active));
      console.log('Active links:', activeLinks);
      console.log('Active count:', activeLinks.length);
      
      activeLinks.forEach(link => {
        console.log(`- ${link.platform}: ${link.name_ar} (${link.url})`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching social media:', error);
  }
};

// Auto-run the test
testSocialMedia();

console.log('\nTo run this test manually, call: testSocialMedia()');