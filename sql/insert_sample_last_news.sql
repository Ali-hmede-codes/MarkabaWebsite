-- Sample inserts for last_news table
-- Run this in phpMyAdmin to add test data

INSERT INTO last_news (title_ar, content_ar, slug, priority) VALUES
('عنوان خبر أخير 1', 'محتوى الخبر الأخير الأول.', 'last-news-1', 1),
('عنوان خبر أخير 2', 'محتوى الخبر الأخير الثاني.', 'last-news-2', 2),
('عنوان خبر أخير 3', 'محتوى الخبر الأخير الثالث.', 'last-news-3', 3),
('عنوان خبر أخير 4', 'محتوى الخبر الأخير الرابع.', 'last-news-4', 4),
('عنوان خبر أخير 5', 'محتوى الخبر الأخير الخامس.', 'last-news-5', 5);

-- For breaking news samples (if needed)
INSERT INTO breaking_news (title_ar, content_ar, slug, priority, is_active) VALUES
('عنوان خبر عاجل 1', 'محتوى الخبر العاجل الأول.', 'breaking-1', 1, 1),
('عنوان خبر عاجل 2', 'محتوى الخبر العاجل الثاني.', 'breaking-2', 2, 1);