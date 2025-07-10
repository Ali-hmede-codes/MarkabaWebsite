import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowUp,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiYoutube,
  FiLinkedin,
  FiSend,
  FiMessageCircle
} from 'react-icons/fi';
import { useContent } from '../../hooks/useContent';
import { useCategories, useSocialMedia } from '../API/hooks';
import type { Category, SocialMedia } from '../API/types';

const Footer: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { content } = useContent();
  const { data: categoriesResponse } = useCategories();
  const { data: socialMediaData, loading: socialMediaLoading } = useSocialMedia();
  const categories = categoriesResponse?.categories || [];
  const socialMediaLinks: SocialMedia[] = (socialMediaData && Array.isArray(socialMediaData)) ? socialMediaData : [];
  
  // Function to get icon component for social media platform
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return FiFacebook;
      case 'twitter':
        return FiTwitter;
      case 'instagram':
        return FiInstagram;
      case 'youtube':
        return FiYoutube;
      case 'linkedin':
        return FiLinkedin;
      case 'telegram':
        return FiSend;
      case 'whatsapp':
        return FiMessageCircle;
      default:
        return FiFacebook;
    }
  };
  
  // Function to get hover color for social media platform
  const getSocialHoverColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return 'hover:text-blue-600';
      case 'twitter':
        return 'hover:text-blue-400';
      case 'instagram':
        return 'hover:text-pink-600';
      case 'youtube':
        return 'hover:text-red-600';
      case 'linkedin':
        return 'hover:text-blue-700';
      case 'telegram':
        return 'hover:text-blue-500';
      case 'whatsapp':
        return 'hover:text-green-500';
      default:
        return 'hover:text-blue-600';
    }
  };

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { 
      label: content?.navigation.home || 'الرئيسية', 
      href: '/' 
    },
    { 
      label: content?.footer.about || 'من نحن', 
      href: '/about' 
    },
    { 
      label: content?.footer.contact || 'اتصل بنا', 
      href: '/contact' 
    },
    { 
      label: content?.footer.privacy || 'سياسة الخصوصية', 
      href: '/privacy' 
    },
    { 
      label: content?.footer.terms || 'شروط الاستخدام', 
      href: '/terms' 
    },
    { 
      label: content?.footer.sitemap || 'خريطة الموقع', 
      href: '/sitemap' 
    },
  ];

  if (!content) return null;

  return (
    <>
      <footer className="bg-gray-900 text-gray-300" dir="rtl">
        <div className="container mx-auto responsive-padding py-8 sm:py-12">
          <div className="footer-grid">
            {/* About Section */}
            <div className="footer-section">
              <div className="responsive-flex space-x-2 rtl:space-x-reverse">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-lg">ن</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-white">
                  {content.site.name}
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed responsive-text">
                {content.site.description}
              </p>
              
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="responsive-flex space-x-2 rtl:space-x-reverse responsive-text">
                  <FiMail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span className="break-all">{content.site.email}</span>
                </div>
                <div className="responsive-flex space-x-2 rtl:space-x-reverse responsive-text">
                  <FiPhone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span>{content.site.phone}</span>
                </div>
                <div className="responsive-flex space-x-2 rtl:space-x-reverse responsive-text">
                  <FiMapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span>{content.site.address}</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="footer-section">
              <h3 className="footer-title">
                {content.navigation.categories}
              </h3>
              <ul className="space-y-2">
                {categories?.slice(0, 8).map((category: Category) => (
                  <li key={category.id}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="footer-link"
                    >
                      {(content.categories as Record<string, string>)[category.slug] || category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h3 className="footer-title">
                {content.footer.quick_links_title}
              </h3>
              <ul className="space-y-2">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="footer-link"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter & Social */}
            <div className="footer-section">
              <h3 className="footer-title">
                {content.footer.stay_connected}
              </h3>
              
              {/* Newsletter Signup */}
              <div className="space-y-3">
                <p className="text-gray-400 responsive-text">
                  {content.footer.newsletter_text}
                </p>
                <form className="flex flex-col space-y-2">
                  <input
                    type="email"
                    placeholder={content.footer.email_placeholder}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent responsive-text touch-target"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 responsive-text font-medium touch-target"
                  >
                    {content.footer.subscribe}
                  </button>
                </form>
              </div>

              {/* Social Media Links */}
              <div className="space-y-3">
                <h4 className="responsive-text font-medium text-white">
                  {content.footer.follow_us}
                </h4>
                <div className="responsive-flex space-x-3 rtl:space-x-reverse">
                  {socialMediaLinks
                    ?.filter((link: SocialMedia) => Boolean(link.is_active))
                    ?.sort((a: SocialMedia, b: SocialMedia) => a.sort_order - b.sort_order)
                    ?.map((link: SocialMedia) => {
                      const IconComponent = getSocialIcon(link.platform);
                      const hoverColor = getSocialHoverColor(link.platform);
                      return (
                        <a
                          key={link.id}
                          href={link.url.trim().replace(/`/g, '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-gray-400 ${hoverColor} transition-colors duration-200 touch-target p-1`}
                          aria-label={link.name_ar}
                          title={link.name_ar}
                        >
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                        </a>
                      );
                    })
                  }
                  {socialMediaLoading && (
                    <div className="text-gray-400 text-xs">جاري التحميل...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800">
            <div className="footer-bottom">
              <div className="responsive-text text-gray-400 text-center md:text-right">
                <p>
                  © {currentYear} {content.site.name}. {content.footer.rights_reserved}
                </p>
              </div>
              
              <div className="footer-bottom-links">
                <Link 
                  href="/privacy" 
                  className="footer-link"
                >
                  {content.footer.privacy}
                </Link>
                <Link 
                  href="/terms" 
                  className="footer-link"
                >
                  {content.footer.terms}
                </Link>
                <Link 
                  href="/sitemap" 
                  className="footer-link"
                >
                  {content.footer.sitemap}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="scroll-to-top"
          aria-label="العودة إلى الأعلى"
        >
          <FiArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </>
  );
};

export default Footer;