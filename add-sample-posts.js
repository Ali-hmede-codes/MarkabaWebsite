const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'markabadatabase',
  charset: 'utf8mb4'
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

async function addSamplePosts() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');
    
    const samplePosts = [
      {
        title_ar: 'تطورات جديدة في السياسة المحلية',
        content_ar: 'شهدت الساحة السياسية المحلية تطورات مهمة خلال الأسبوع الماضي، حيث تم الإعلان عن مبادرات جديدة تهدف إلى تحسين الخدمات العامة وتعزيز الشفافية في العمل الحكومي.',
        excerpt_ar: 'تطورات مهمة في السياسة المحلية تشمل مبادرات جديدة لتحسين الخدمات',
        category_id: 1,
        author_id: 1,
        is_published: 1,
        featured_image: '/images/politics1.jpg'
      },
      {
        title_ar: 'فوز الفريق المحلي في البطولة الإقليمية',
        content_ar: 'حقق الفريق المحلي لكرة القدم إنجازاً كبيراً بفوزه في البطولة الإقليمية بعد مباراة مثيرة استمرت 90 دقيقة مليئة بالإثارة والتشويق.',
        excerpt_ar: 'الفريق المحلي يحقق إنجازاً كبيراً بالفوز في البطولة الإقليمية',
        category_id: 2,
        author_id: 1,
        is_published: 1,
        featured_image: '/images/sports1.jpg'
      },
      {
        title_ar: 'ابتكارات تقنية جديدة تغير مستقبل التعليم',
        content_ar: 'تشهد قطاع التعليم ثورة حقيقية مع ظهور تقنيات جديدة تعتمد على الذكاء الاصطناعي والواقع المعزز، مما يوفر تجربة تعليمية أكثر تفاعلية وفعالية.',
        excerpt_ar: 'تقنيات جديدة تعتمد على الذكاء الاصطناعي تحدث ثورة في التعليم',
        category_id: 3,
        author_id: 1,
        is_published: 1,
        featured_image: '/images/tech1.jpg'
      },
      {
        title_ar: 'نصائح مهمة للحفاظ على الصحة في فصل الشتاء',
        content_ar: 'مع دخول فصل الشتاء، يصبح من المهم اتباع نصائح صحية معينة للوقاية من الأمراض الموسمية وتعزيز المناعة الطبيعية للجسم.',
        excerpt_ar: 'نصائح صحية مهمة للوقاية من أمراض الشتاء وتعزيز المناعة',
        category_id: 4,
        author_id: 1,
        is_published: 1,
        featured_image: '/images/health1.jpg'
      },
      {
        title_ar: 'تحسن مؤشرات الاقتصاد المحلي خلال الربع الأخير',
        content_ar: 'أظهرت البيانات الاقتصادية الأخيرة تحسناً ملحوظاً في مؤشرات الاقتصاد المحلي، مع ارتفاع معدلات النمو وانخفاض معدلات البطالة.',
        excerpt_ar: 'البيانات الاقتصادية تظهر تحسناً في النمو وانخفاض البطالة',
        category_id: 5,
        author_id: 1,
        is_published: 1,
        featured_image: '/images/economy1.jpg'
      },
      {
        title_ar: 'معرض فني جديد يستعرض أعمال الفنانين المحليين',
        content_ar: 'افتتح معرض فني جديد في المدينة يستعرض أعمال مجموعة من الفنانين المحليين الموهوبين، ويقدم لوحات ومنحوتات تعكس الثقافة والتراث المحلي.',
        excerpt_ar: 'معرض فني جديد يستعرض أعمال الفنانين المحليين والتراث الثقافي',
        category_id: 6,
        author_id: 1,
        is_published: 1,
        featured_image: '/images/culture1.jpg'
      }
    ];
    
    for (const post of samplePosts) {
      const slug = generateSlug(post.title_ar) + '-' + Date.now();
      const reading_time = Math.ceil(post.content_ar.length / 200); // Approximate reading time
      
      await connection.execute(
        `INSERT INTO posts (
          title_ar, content_ar, excerpt_ar, slug, category_id, author_id,
          featured_image, is_published, reading_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          post.title_ar,
          post.content_ar,
          post.excerpt_ar,
          slug,
          post.category_id,
          post.author_id,
          post.featured_image,
          post.is_published,
          reading_time
        ]
      );
      
      console.log(`Added post: ${post.title_ar}`);
    }
    
    console.log('\nAll sample posts added successfully!');
    
  } catch (error) {
    console.error('Error adding sample posts:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSamplePosts();