const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'markabadatabase',
  charset: 'utf8mb4'
};

// Sample Arabic breaking news data
const breakingNewsData = [
  {
    title_ar: 'عاجل: اجتماع طارئ لمجلس الوزراء لمناقشة الأوضاع الاقتصادية',
    content_ar: 'يعقد مجلس الوزراء اجتماعاً طارئاً اليوم لمناقشة التطورات الاقتصادية الأخيرة واتخاذ الإجراءات اللازمة لدعم الاقتصاد الوطني.',
    priority: 1
  },
  {
    title_ar: 'إعلان نتائج الانتخابات المحلية في المحافظات الشمالية',
    content_ar: 'أعلنت لجنة الانتخابات المركزية النتائج النهائية للانتخابات المحلية في المحافظات الشمالية بعد انتهاء عملية الفرز.',
    priority: 2
  },
  {
    title_ar: 'توقيع اتفاقية تعاون اقتصادي جديدة مع دول الجوار',
    content_ar: 'وقعت الحكومة اتفاقية تعاون اقتصادي استراتيجية مع دول الجوار تهدف إلى تعزيز التبادل التجاري والاستثمار المشترك.',
    priority: 1
  },
  {
    title_ar: 'إطلاق مشروع البنية التحتية الرقمية الوطني',
    content_ar: 'أطلقت وزارة التكنولوجيا مشروع البنية التحتية الرقمية الوطني الذي يهدف إلى تحديث شبكات الاتصالات وتوسيع نطاق الإنترنت.',
    priority: 2
  },
  {
    title_ar: 'افتتاح أكبر مستشفى متخصص في المنطقة',
    content_ar: 'افتتح رئيس الوزراء أكبر مستشفى متخصص في المنطقة والذي يضم أحدث التقنيات الطبية ويخدم أكثر من مليون مواطن.',
    priority: 3
  },
  {
    title_ar: 'إعلان حالة الطوارئ بسبب الأحوال الجوية السيئة',
    content_ar: 'أعلنت السلطات المحلية حالة الطوارئ في عدة محافظات بسبب الأحوال الجوية السيئة والأمطار الغزيرة المتوقعة.',
    priority: 1
  },
  {
    title_ar: 'انطلاق فعاليات المهرجان الثقافي السنوي',
    content_ar: 'انطلقت فعاليات المهرجان الثقافي السنوي بمشاركة فنانين وأدباء من مختلف البلدان العربية والعالمية.',
    priority: 3
  },
  {
    title_ar: 'إقرار قانون جديد لحماية البيئة والمناخ',
    content_ar: 'أقر البرلمان قانوناً جديداً لحماية البيئة والمناخ يتضمن إجراءات صارمة للحد من التلوث وحماية الموارد الطبيعية.',
    priority: 2
  },
  {
    title_ar: 'تدشين أول قطار سريع يربط العاصمة بالمدن الرئيسية',
    content_ar: 'دشن وزير النقل أول قطار سريع يربط العاصمة بالمدن الرئيسية، مما يقلل زمن السفر إلى النصف ويحسن وسائل النقل.',
    priority: 1
  },
  {
    title_ar: 'إعلان نتائج مسابقة الابتكار التكنولوجي للشباب',
    content_ar: 'أعلنت وزارة الشباب والرياضة نتائج مسابقة الابتكار التكنولوجي للشباب والتي شارك فيها أكثر من ألف مبتكر شاب.',
    priority: 3
  }
];

// Sample Arabic posts data
const postsData = [
  {
    title_ar: 'التطورات الاقتصادية الجديدة وأثرها على السوق المحلي',
    content_ar: 'تشهد الأسواق المحلية تطورات إيجابية ملحوظة خلال الفترة الأخيرة، حيث ارتفعت مؤشرات النمو الاقتصادي وتحسنت معدلات التوظيف. هذه التطورات تأتي نتيجة للسياسات الاقتصادية الجديدة التي تبنتها الحكومة والتي تهدف إلى تنويع مصادر الدخل وتعزيز الاستثمار في القطاعات الحيوية.',
    excerpt_ar: 'تشهد الأسواق المحلية تطورات إيجابية ملحوظة مع ارتفاع مؤشرات النمو',
    slug: 'التطورات-الاقتصادية-الجديدة-وأثرها-على-السوق-المحلي',
    category_id: 5,
    featured_image: '/images/economy1.jpg'
  },
  {
    title_ar: 'التعليم الرقمي: مستقبل التعلم في العصر الحديث',
    content_ar: 'يشهد قطاع التعليم تحولاً جذرياً نحو الرقمنة، حيث تتبنى المؤسسات التعليمية تقنيات حديثة لتطوير العملية التعليمية. هذا التحول يشمل استخدام المنصات الرقمية، والذكاء الاصطناعي، والواقع الافتراضي لتحسين جودة التعليم وجعله أكثر تفاعلية وفعالية.',
    excerpt_ar: 'قطاع التعليم يشهد تحولاً جذرياً نحو الرقمنة والتقنيات الحديثة',
    slug: 'التعليم-الرقمي-مستقبل-التعلم-في-العصر-الحديث',
    category_id: 2,
    featured_image: '/images/education1.jpg'
  },
  {
    title_ar: 'الرياضة المحلية تحقق إنجازات عالمية جديدة',
    content_ar: 'حققت الرياضة المحلية إنجازات مميزة على المستوى العالمي، حيث تمكن الرياضيون المحليون من الفوز بعدة ميداليات في البطولات الدولية. هذه الإنجازات تعكس الاستثمار الكبير في البنية التحتية الرياضية وبرامج تطوير المواهب الشابة.',
    excerpt_ar: 'الرياضيون المحليون يحققون إنجازات مميزة في البطولات الدولية',
    slug: 'الرياضة-المحلية-تحقق-إنجازات-عالمية-جديدة',
    category_id: 4,
    featured_image: '/images/sports1.jpg'
  },
  {
    title_ar: 'الابتكار التكنولوجي يقود التنمية المستدامة',
    content_ar: 'تلعب التكنولوجيا دوراً محورياً في تحقيق التنمية المستدامة، حيث تساهم الابتكارات التقنية في حل التحديات البيئية والاجتماعية. من الطاقة المتجددة إلى الذكاء الاصطناعي، تفتح التكنولوجيا آفاقاً جديدة لمستقبل أكثر استدامة.',
    excerpt_ar: 'التكنولوجيا تلعب دوراً محورياً في تحقيق التنمية المستدامة',
    slug: 'الابتكار-التكنولوجي-يقود-التنمية-المستدامة',
    category_id: 2,
    featured_image: '/images/technology1.jpg'
  },
  {
    title_ar: 'الثقافة والفنون: جسر التواصل بين الشعوب',
    content_ar: 'تمثل الثقافة والفنون جسراً مهماً للتواصل بين الشعوب والحضارات المختلفة. من خلال المعارض الفنية والمهرجانات الثقافية، يتم تبادل الخبرات والتجارب الإنسانية، مما يعزز التفاهم المتبادل ويثري التنوع الثقافي.',
    excerpt_ar: 'الثقافة والفنون تمثل جسراً مهماً للتواصل بين الشعوب',
    slug: 'الثقافة-والفنون-جسر-التواصل-بين-الشعوب',
    category_id: 6,
    featured_image: '/images/culture1.jpg'
  },
  {
    title_ar: 'الصحة العامة: استراتيجيات جديدة للوقاية والعلاج',
    content_ar: 'تتطور استراتيجيات الصحة العامة باستمرار لمواجهة التحديات الصحية المعاصرة. من الطب الوقائي إلى العلاجات المتقدمة، تسعى النظم الصحية إلى تحسين جودة الرعاية الصحية وضمان وصولها لجميع فئات المجتمع.',
    excerpt_ar: 'استراتيجيات الصحة العامة تتطور لمواجهة التحديات المعاصرة',
    slug: 'الصحة-العامة-استراتيجيات-جديدة-للوقاية-والعلاج',
    category_id: 3,
    featured_image: '/images/health1.jpg'
  },
  {
    title_ar: 'السياحة البيئية: نموذج جديد للسفر المستدام',
    content_ar: 'تنمو السياحة البيئية كنموذج جديد للسفر المستدام الذي يحترم البيئة والثقافات المحلية. هذا النوع من السياحة يركز على الحفاظ على الطبيعة وتوفير تجارب أصيلة للزوار مع دعم المجتمعات المحلية اقتصادياً.',
    excerpt_ar: 'السياحة البيئية تنمو كنموذج جديد للسفر المستدام',
    slug: 'السياحة-البيئية-نموذج-جديد-للسفر-المستدام',
    category_id: 1,
    featured_image: '/images/tourism1.jpg'
  },
  {
    title_ar: 'الأمن السيبراني في عصر التحول الرقمي',
    content_ar: 'مع تزايد الاعتماد على التكنولوجيا الرقمية، يصبح الأمن السيبراني أولوية قصوى للحكومات والشركات. تتطور التهديدات السيبرانية باستمرار، مما يتطلب استراتيجيات أمنية متقدمة وتدريب مستمر للكوادر المتخصصة.',
    excerpt_ar: 'الأمن السيبراني يصبح أولوية قصوى في عصر التحول الرقمي',
    slug: 'الأمن-السيبراني-في-عصر-التحول-الرقمي',
    category_id: 2,
    featured_image: '/images/cybersecurity1.jpg'
  },
  {
    title_ar: 'الزراعة الذكية: تقنيات حديثة لإنتاج أفضل',
    content_ar: 'تشهد الزراعة تطوراً تقنياً كبيراً من خلال تطبيق مفاهيم الزراعة الذكية. هذه التقنيات تشمل استخدام أجهزة الاستشعار، والذكاء الاصطناعي، وإنترنت الأشياء لتحسين الإنتاجية وتقليل استهلاك الموارد.',
    excerpt_ar: 'الزراعة الذكية تستخدم تقنيات حديثة لتحسين الإنتاجية',
    slug: 'الزراعة-الذكية-تقنيات-حديثة-لإنتاج-أفضل',
    category_id: 5,
    featured_image: '/images/agriculture1.jpg'
  },
  {
    title_ar: 'المدن الذكية: رؤية مستقبلية للحياة الحضرية',
    content_ar: 'تتجه المدن الحديثة نحو تطبيق مفهوم المدن الذكية لتحسين جودة الحياة للمواطنين. هذا المفهوم يشمل استخدام التكنولوجيا في إدارة المرور، والطاقة، والخدمات العامة بطريقة أكثر كفاءة واستدامة.',
    excerpt_ar: 'المدن الذكية تستخدم التكنولوجيا لتحسين جودة الحياة الحضرية',
    slug: 'المدن-الذكية-رؤية-مستقبلية-للحياة-الحضرية',
    category_id: 2,
    featured_image: '/images/smartcity1.jpg'
  }
];

async function populateDatabase() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await connection.execute('DELETE FROM breaking_news WHERE id > 0');
    await connection.execute('DELETE FROM posts WHERE id > 0');
    await connection.execute('ALTER TABLE breaking_news AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE posts AUTO_INCREMENT = 1');
    
    // Insert breaking news
    console.log('📰 Inserting breaking news...');
    for (let i = 0; i < breakingNewsData.length; i++) {
      const news = breakingNewsData[i];
      await connection.execute(
          'INSERT INTO breaking_news (title_ar, content_ar, priority, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
          [news.title_ar, news.content_ar, news.priority]
        );
      console.log(`   ${i + 1}. ${news.title_ar.substring(0, 50)}...`);
    }
    
    // Insert posts
    console.log('📝 Inserting posts...');
    for (let i = 0; i < postsData.length; i++) {
      const post = postsData[i];
      await connection.execute(
        `INSERT INTO posts (title_ar, content_ar, excerpt_ar, slug, category_id, author_id, featured_image, 
         is_published, is_featured, views, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 1, ?, 1, 0, 0, NOW(), NOW())`,
        [
          post.title_ar,
          post.content_ar,
          post.excerpt_ar,
          post.slug,
          post.category_id,
          post.featured_image
        ]
      );
      console.log(`   ${i + 1}. ${post.title_ar.substring(0, 50)}...`);
    }
    
    // Get counts
    const [breakingNewsCount] = await connection.execute('SELECT COUNT(*) as count FROM breaking_news');
    const [postsCount] = await connection.execute('SELECT COUNT(*) as count FROM posts');
    
    console.log('\n🎉 Database populated successfully!');
    console.log(`📰 Breaking News: ${breakingNewsCount[0].count} items`);
    console.log(`📝 Posts: ${postsCount[0].count} items`);
    console.log('\n✨ Your news site now has fresh content!');
    
  } catch (error) {
    console.error('❌ Error populating database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
populateDatabase();