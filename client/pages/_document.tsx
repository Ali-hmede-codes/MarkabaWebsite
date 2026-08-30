import Document, { 
  Html, 
  Head, 
  Main, 
  NextScript, 
  DocumentContext, 
  DocumentInitialProps, 
} from 'next/document' 

interface MyDocumentProps extends DocumentInitialProps {
  metaData?: {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
  };
  nonce?: string;
}

class MyDocument extends Document<MyDocumentProps> { 
  static async getInitialProps( 
    ctx: DocumentContext 
  ): Promise<MyDocumentProps> { 
    const originalRenderPage = ctx.renderPage 

    // Run the React rendering logic synchronously 
    ctx.renderPage = () => 
      originalRenderPage({ 
        // Useful for wrapping the whole react tree 
        enhanceApp: (App) => App, 
        // Useful for wrapping in a per-page basis 
        enhanceComponent: (Component) => Component, 
      }) 

    // Run the parent `getInitialProps`, it now includes the custom `renderPage` 
    const initialProps = await Document.getInitialProps(ctx) 

    // Get meta data from page props if available
    let metaData: { title?: string; description?: string; keywords?: string; image?: string; url?: string } | undefined;
    
    if (ctx.pathname === '/') {
      metaData = {
        title: 'مـركـبـا - الـمـنـصـة الاخـبـاريـة',
        description: 'ابق على اطلاع بآخر الأخبار والقصص العاجلة والتحليلات المتعمقة من مـركـبـا - الـمـنـصـة الاخـبـاريـة',
        keywords: 'أخبار, أخبار عاجلة, تحديثات, صحافة, أحداث جارية, لبنان, الشرق الأوسط'
      };
    } else if (ctx.pathname === '/category/[slug]' && ctx.query?.slug) {
      // For category pages, fetch the category data to get meta information
      try {
        const slug = ctx.query.slug as string;
        const isDevelopment = process.env.NODE_ENV === 'development';
        const { INTERNAL_API_BASE } = await import('../lib/api/config');
        
        const categoryResponse = await fetch(`${INTERNAL_API_BASE}/categories?slug=${slug}`, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NewsMarkaba-SSR/1.0'
          }
        });
        
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          const category = categoryData.success && categoryData.data?.categories?.length > 0 ? categoryData.data.categories[0] : null;
          
          if (category) {
            const categoryName = category.name_ar || category.name;
            const categoryDescription = category.description_ar || category.description || `تصفح جميع أخبار ${categoryName} على مـركـبـا - الـمـنـصـة الاخـبـاريـة`;
            const categoryImage = category.image;
            
            // Ensure image URL is absolute for social media sharing
            let fullImageUrl = categoryImage;
            if (categoryImage && !categoryImage.startsWith('http')) {
              const imageBaseUrl = 'https://markaba.news';
              fullImageUrl = categoryImage.startsWith('/') ? `${imageBaseUrl}${categoryImage}` : `${imageBaseUrl}/${categoryImage}`;
            }
            
            // Construct the full URL for the category
            const protocol = ctx.req?.headers['x-forwarded-proto'] || (isDevelopment ? 'http' : 'https');
            const host = ctx.req?.headers.host || (isDevelopment ? 'localhost:3000' : 'markaba.news');
            const fullUrl = `${protocol}://${host}/category/${slug}`;
            
            metaData = {
              title: `${categoryName} - أخبار`,
              description: categoryDescription,
              keywords: `أخبار, ${categoryName}, مقالات, مـركـبـا - الـمـنـصـة الاخـبـاريـة, لبنان, الشرق الأوسط`,
              image: fullImageUrl || 'https://markaba.news/images/og-image.jpg',
              url: fullUrl
            };
          }
        }
      } catch (error) {
        console.error('Error fetching category meta data:', error);
      }
    } else if (ctx.pathname === '/post/[slug]' && ctx.query?.slug) {
       // For post pages, fetch the post data to get meta information
       try {
         const slug = ctx.query.slug as string;
         const isDevelopment = process.env.NODE_ENV === 'development';
         const { INTERNAL_API_BASE } = await import('../lib/api/config');
         
         const postResponse = await fetch(`${INTERNAL_API_BASE}/posts?slug=${slug}&limit=1&page=1`, {
           headers: {
             'Content-Type': 'application/json',
             'User-Agent': 'NewsMarkaba-SSR/1.0'
           }
         });
         
         if (postResponse.ok) {
           const postData = await postResponse.json();
           const post = postData.success && postData.data?.posts?.length > 0 ? postData.data.posts[0] : null;
           
           if (post) {
             const postTitle = post.title_ar || post.title;
             const postDescription = post.excerpt_ar || post.excerpt || post.meta_description_ar || post.meta_description;
             const postImage = post.featured_image;
             
             // Ensure image URL is absolute for social media sharing
             let fullImageUrl = postImage;
             if (postImage && !postImage.startsWith('http')) {
               const imageBaseUrl = 'https://markaba.news';
               fullImageUrl = postImage.startsWith('/') ? `${imageBaseUrl}${postImage}` : `${imageBaseUrl}/${postImage}`;
             }
             
             // Construct the full URL for the post
             const protocol = ctx.req?.headers['x-forwarded-proto'] || (isDevelopment ? 'http' : 'https');
             const host = ctx.req?.headers.host || (isDevelopment ? 'localhost:3000' : 'markaba.news');
             const fullUrl = `${protocol}://${host}/post/${slug}`;
             
             metaData = {
               title: `${postTitle} - أخبار`,
               description: postDescription || `اقرأ المزيد عن ${postTitle} في مـركـبـا - الـمـنـصـة الاخـبـاريـة`,
               keywords: post.meta_keywords_ar || post.meta_keywords || 'أخبار, أخبار عاجلة, تحديثات, صحافة, أحداث جارية, لبنان, الشرق الأوسط',
               image: fullImageUrl,
               url: fullUrl
             };
           }
         }
       } catch (error) {
         console.error('Error fetching post meta data:', error);
       }
     }

    const nonce = ctx.req?.headers['x-nonce'] as string || '';
    return { ...initialProps, metaData, nonce };
  }

  render() {
    const { metaData, nonce } = this.props;
    return (
      <Html lang="ar" dir="rtl">
        <Head>
          {/* Essential charset - MUST be first */}
          <meta charSet="UTF-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          
          {/* Dynamic meta tags from page props */}
          {metaData?.description && <meta name="description" content={metaData.description} />}
          {metaData?.keywords && <meta name="keywords" content={metaData.keywords} />}
          
          {/* Open Graph meta tags for posts */}
          {metaData?.title && <meta property="og:title" content={metaData.title} />}
          {metaData?.description && <meta property="og:description" content={metaData.description} />}
          {metaData?.image && <meta property="og:image" content={metaData.image} />}
          {metaData?.image && <meta property="og:image:width" content="1200" />}
          {metaData?.image && <meta property="og:image:height" content="630" />}
          {metaData?.url && <meta property="og:url" content={metaData.url} />}
          {metaData && <meta property="og:type" content="article" />}
          <meta property="og:site_name" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
          <meta property="og:locale" content="ar_AR" />
          
          {/* Twitter Card meta tags */}
          <meta name="twitter:card" content="summary_large_image" />
          {metaData?.title && <meta name="twitter:title" content={metaData.title} />}
          {metaData?.description && <meta name="twitter:description" content={metaData.description} />}
          {metaData?.image && <meta name="twitter:image" content={metaData.image} />}
          <meta name="twitter:site" content="@markaba_news" />
          
          {/* Preconnect to external domains for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Google Fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&family=Alexandria:wght@100;200;300;400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
          
          {/* Favicons */}
          <link rel="icon" href="/favicon.ico" type="image/x-icon" />
          <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
          <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
          <link rel="icon" href="/android-chrome-192x192.png" sizes="192x192" type="image/png" />
          <link rel="icon" href="/android-chrome-512x512.png" sizes="512x512" type="image/png" />
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* Theme color for mobile browsers */}
          <meta name="theme-color" content="#3B82F6" />
          <meta name="msapplication-TileColor" content="#3B82F6" />
        
          {/* Security headers */}
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
          
          
          {/* Sitemap */}
          <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
          
          {/* Global site settings - page-specific meta tags handled by layouts */}
          <meta name="publisher" content="مـركـبـا - الـمـنـصـة الاخـبـاريـة" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          
          {/* Global Twitter Tags removed - handled by SimpleMeta component */}
          
          {/* Schema.org Structured Data for Site Name */}
          <script
            type="application/ld+json"
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "مركبا المنصة الاخبارية",
                "alternateName": "مركبا المنصة الاخبارية",
                "url": "https://www.markaba.news/"
              })
            }}
          />

          {/* OneSignal Push Notifications */}
          <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" nonce={nonce} defer></script>
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                OneSignalDeferred.push(async function(OneSignal) {
                  try {
                    // Only initialize OneSignal on production domain
                    if (typeof window !== 'undefined' &&
                        window.location.hostname === 'www.markaba.news') {
                      await OneSignal.init({
                        appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '02e93d78-0cea-455a-82c1-cfef034fbf18'}",
                        safari_web_id: "${process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || 'web.onesignal.auto.4b99c5db-a7c9-461a-8333-facb0838095d'}",
                        allowLocalhostAsSecureOrigin: true,
                        notificationClickHandlerMatch: 'origin',
                        notificationClickHandlerAction: 'navigate',
                      notifyButton: {
                        enable: ${process.env.NEXT_PUBLIC_ONESIGNAL_NOTIFY_BUTTON !== 'false'},
                        size: 'medium',
                        theme: 'default',
                        position: 'bottom-right',
                        showCredit: false,
                        text: {
                          'tip.state.unsubscribed': 'اشترك في الإشعارات',
                          'tip.state.subscribed': "أنت مشترك في الإشعارات",
                          'tip.state.blocked': "لقد حظرت الإشعارات",
                          'message.prenotify': 'انقر للاشتراك في الإشعارات',
                          'message.action.subscribed': "شكراً لك! ستتلقى الإشعارات",
                          'message.action.resubscribed': "أنت مشترك في الإشعارات",
                          'message.action.unsubscribed': "لن تتلقى المزيد من الإشعارات",
                          'dialog.main.title': 'إدارة إشعارات الموقع',
                          'dialog.main.button.subscribe': 'اشتراك',
                          'dialog.main.button.unsubscribe': 'إلغاء الاشتراك',
                          'dialog.blocked.title': 'إلغاء حظر الإشعارات',
                          'dialog.blocked.message': "اتبع هذه التعليمات لإلغاء حظر الإشعارات:"
                        }
                      }
                    });
                    
                    // Show the notification prompt after initialization using v16 API
                    setTimeout(async () => {
                      try {
                        // Check if push notifications are supported
                        if (OneSignal.Notifications.isPushSupported()) {
                          // Use the correct v16 method to show slidedown prompt
                          await OneSignal.Slidedown.promptPush();
                        }
                      } catch (error) {
                        console.log('Slidedown prompt error, trying permission request:', error);
                        try {
                          // Fallback to direct permission request
                          await OneSignal.Notifications.requestPermission();
                        } catch (permError) {
                          console.log('Permission request error:', permError);
                        }
                      }
                    }, 3000);
                    
                    } else {
                      console.log('OneSignal: Not initializing on localhost/development');
                    }
                    
                  } catch (error) {
                    console.error('OneSignal initialization error:', error);
                  }
                });
              `,
            }}
          />
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
        <NextScript nonce={nonce} />
        {process.env.NODE_ENV === 'production' && (
          <>
            <script
              nonce={nonce}
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-XV0VQHJ2NJ"
            />
            <script
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-XV0VQHJ2NJ');
                `,
              }}
            />
            <script
              nonce={nonce}
              async
              src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v13.0"
            />
          </>
        )}
      </body>
    </Html>
    );
  }
}

export default MyDocument;