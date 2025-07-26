import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* Favicons */}
        <link rel="icon" href="/faveicon.png" type="image/png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#3B82F6" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        
        {/* Viewport is handled automatically by Next.js */}
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* RSS Feed */}
        <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/api/rss" />
        
        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        
        {/* Robots */}
        <meta name="robots" content="index, follow" />
        
        {/* Author and publisher */}
        <meta name="author" content="News Website" />
        <meta name="publisher" content="News Website" />
        
        {/* Open Graph default tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="News Website" />
        
        {/* Twitter Card default tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@newswebsite" />
        
        {/* Preload critical resources - fonts loaded from Google Fonts */}
      </Head>
      <body className="antialiased">
        {/* No-script fallback */}
        <noscript>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            fontSize: '18px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div>
              <h1>JavaScript Required</h1>
              <p>This website requires JavaScript to function properly. Please enable JavaScript in your browser settings.</p>
              <p>هذا الموقع يتطلب JavaScript للعمل بشكل صحيح. يرجى تفعيل JavaScript في إعدادات المتصفح.</p>
            </div>
          </div>
        </noscript>
        <Main />
        <NextScript />
        
        {/* Analytics scripts can be added here */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                        page_title: document.title,
                        page_location: window.location.href,
                      });
                    `,
                  }}
                />
              </>
            )}
            
            {/* Facebook Pixel */}
            {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                    fbq('track', 'PageView');
                  `,
                }}
              />
            )}
          </>
        )}
      </body>
    </Html>
  );
}