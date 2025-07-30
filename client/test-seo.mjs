import https from 'https';
import http from 'http';

// Test SEO meta tags for the website
function testMetaTags(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function extractMetaTags(html) {
  const metaTags = {
    title: '',
    description: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogUrl: '',
    twitterCard: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: ''
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) metaTags.title = titleMatch[1].trim();

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) metaTags.description = descMatch[1].trim();

  // Extract Open Graph tags
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) metaTags.ogTitle = ogTitleMatch[1].trim();

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch) metaTags.ogDescription = ogDescMatch[1].trim();

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) metaTags.ogImage = ogImageMatch[1].trim();

  const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
  if (ogUrlMatch) metaTags.ogUrl = ogUrlMatch[1].trim();

  // Extract Twitter Card tags
  const twitterCardMatch = html.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i);
  if (twitterCardMatch) metaTags.twitterCard = twitterCardMatch[1].trim();

  const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
  if (twitterTitleMatch) metaTags.twitterTitle = twitterTitleMatch[1].trim();

  const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
  if (twitterDescMatch) metaTags.twitterDescription = twitterDescMatch[1].trim();

  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
  if (twitterImageMatch) metaTags.twitterImage = twitterImageMatch[1].trim();

  return metaTags;
}

function displayResults(url, metaTags) {
  // eslint-disable-next-line no-console
  console.log(`\n🔍 SEO Analysis for: ${url}`);
  // eslint-disable-next-line no-console
  console.log('='.repeat(60));
  
  // eslint-disable-next-line no-console
  console.log('\n📄 Basic Meta Tags:');
  // eslint-disable-next-line no-console
  console.log(`Title: ${metaTags.title || '❌ Missing'}`);
  // eslint-disable-next-line no-console
  console.log(`Description: ${metaTags.description || '❌ Missing'}`);
  
  // eslint-disable-next-line no-console
  console.log('\n📱 Open Graph Tags:');
  // eslint-disable-next-line no-console
  console.log(`OG Title: ${metaTags.ogTitle || '❌ Missing'}`);
  // eslint-disable-next-line no-console
  console.log(`OG Description: ${metaTags.ogDescription || '❌ Missing'}`);
  // eslint-disable-next-line no-console
  console.log(`OG Image: ${metaTags.ogImage || '❌ Missing'}`);
  // eslint-disable-next-line no-console
  console.log(`OG URL: ${metaTags.ogUrl || '❌ Missing'}`);
  
  // eslint-disable-next-line no-console
  console.log('\n🐦 Twitter Card Tags:');
  // eslint-disable-next-line no-console
  console.log(`Twitter Card: ${metaTags.twitterCard || '❌ Missing'}`);
  // eslint-disable-next-line no-console
  console.log(`Twitter Title: ${metaTags.twitterTitle || '❌ Missing'}`);
  // eslint-disable-next-line no-console
  console.log(`Twitter Description: ${metaTags.twitterDescription || '❌ Missing'}`);
  // eslint-disable-next-line no-console
  console.log(`Twitter Image: ${metaTags.twitterImage || '❌ Missing'}`);
  
  // SEO Score
  const score = calculateSEOScore(metaTags);
  // eslint-disable-next-line no-console
  console.log(`\n📊 SEO Score: ${score}/100`);
  
  if (score < 70) {
    // eslint-disable-next-line no-console
    console.log('\n⚠️  Recommendations:');
    // eslint-disable-next-line no-console
    if (!metaTags.title) console.log('- Add a proper title tag');
    // eslint-disable-next-line no-console
    if (!metaTags.description) console.log('- Add a meta description');
    // eslint-disable-next-line no-console
    if (!metaTags.ogTitle) console.log('- Add Open Graph title');
    // eslint-disable-next-line no-console
    if (!metaTags.ogDescription) console.log('- Add Open Graph description');
    // eslint-disable-next-line no-console
    if (!metaTags.ogImage) console.log('- Add Open Graph image');
    // eslint-disable-next-line no-console
    if (!metaTags.twitterCard) console.log('- Add Twitter Card type');
  } else {
    // eslint-disable-next-line no-console
    console.log('\n✅ Good SEO implementation!');
  }
}

function calculateSEOScore(metaTags) {
  let score = 0;
  
  if (metaTags.title) score += 15;
  if (metaTags.description) score += 15;
  if (metaTags.ogTitle) score += 15;
  if (metaTags.ogDescription) score += 15;
  if (metaTags.ogImage) score += 10;
  if (metaTags.ogUrl) score += 10;
  if (metaTags.twitterCard) score += 10;
  if (metaTags.twitterTitle) score += 5;
  if (metaTags.twitterDescription) score += 5;
  
  return score;
}

// Test the website
async function runTest() {
  const urls = [
    'https://markaba.news',
    // Add more URLs to test specific pages
  ];
  
  for (const url of urls) {
    try {
      // eslint-disable-next-line no-console
      console.log(`\n🚀 Testing: ${url}`);
      const html = await testMetaTags(url);
      const metaTags = extractMetaTags(html);
      displayResults(url, metaTags);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`❌ Error testing ${url}:`, error.message);
    }
  }
  
  // eslint-disable-next-line no-console
  console.log('\n🔗 Test your URLs with these tools:');
  // eslint-disable-next-line no-console
  console.log('- Google Rich Results: https://search.google.com/test/rich-results');
  // eslint-disable-next-line no-console
  console.log('- Facebook Debugger: https://developers.facebook.com/tools/debug/');
  // eslint-disable-next-line no-console
  console.log('- Twitter Validator: https://cards-dev.twitter.com/validator');
  // eslint-disable-next-line no-console
  console.log('- LinkedIn Inspector: https://www.linkedin.com/post-inspector/');
}

// Run the test
runTest();