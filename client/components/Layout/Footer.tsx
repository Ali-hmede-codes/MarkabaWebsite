import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowUp,
  FiMessageCircle
} from 'react-icons/fi';
import { 
  SiFacebook,
  SiTwitter,
  SiInstagram,
  SiYoutube,
  SiLinkedin,
  SiTelegram,
  SiWhatsapp,
  SiTiktok
} from 'react-icons/si';
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
  const whatsappLink = socialMediaLinks.find(link => link.platform.toLowerCase() === 'whatsapp');
  
  // Function to get icon component for social media platform
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return SiFacebook;
      case 'twitter':
        return SiTwitter;
      case 'instagram':
        return SiInstagram;
      case 'youtube':
        return SiYoutube;
      case 'linkedin':
        return SiLinkedin;
      case 'telegram':
        return SiTelegram;
      case 'whatsapp':
        return SiWhatsapp;
      case 'tiktok':
        return SiTiktok;
      default:
        return SiFacebook;
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
      case 'tiktok':
        return 'hover:text-black';
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
      <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-gray-300 shadow-lg" dir="rtl">
        <div className="container mx-auto responsive-padding py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About Section */}
            <div className="footer-section">

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
              
              {/* WhatsApp Channel Subscription */}
              <div className="space-y-4 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <p className="text-gray-200 text-base sm:text-lg font-semibold">
                  اشترك في قناتنا على الواتساب للحصول على آخر الأخبار
                </p>
                {whatsappLink ? (
                  <a
                    href={whatsappLink?.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-xl text-base sm:text-lg font-bold transform hover:scale-105"
                  >
                    <FiMessageCircle className="w-6 h-6 ml-3 rtl:ml-0 rtl:mr-3" />
                    انضم الآن
                  </a>
                ) : (
                  <p className="text-gray-400 text-base">قناة الواتساب غير متوفرة حالياً</p>
                )}
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
                          href={link?.url?.trim()?.replace(/`/g, '') || '#'}
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