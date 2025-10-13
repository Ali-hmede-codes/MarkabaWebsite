import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { useSocialMedia, useCategories } from '../API/hooks';
import type { SocialMedia } from '../API/types';

const Footer: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { content } = useContent();
  const { data: socialMediaData, loading: socialMediaLoading } = useSocialMedia();
  const { data: categoriesData, loading: categoriesLoading } = useCategories();
  const socialMediaLinks: SocialMedia[] = (socialMediaData && Array.isArray(socialMediaData)) ? socialMediaData : [];
  const categories = categoriesData?.categories || [];
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
      label: 'للإعلان معنا', 
      href: '/advertise' 
    },
    { 
      label: 'وظائف شاغرة', 
      href: '/jobs' 
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
      {/* Mobile-responsive footer with full width */}
      <footer className="bg-gray-50 text-gray-800 relative" dir="rtl">
        {/* Main Footer Content */}
        <div className="w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8">
          {/* Logo Section */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Image
                src="/images/logo_new.png"
                alt="Logo"
                width={95}
                height={70}
                className="object-contain sm:w-[80px] sm:h-[40px] lg:w-[160px] lg:h-[80px]"
              />
            </div>
          </div>

          {/* Social Media Section - Directly under logo */}
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <div className="flex justify-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
              {socialMediaLinks
                ?.filter((link: SocialMedia) => Boolean(link.is_active))
                ?.sort((a: SocialMedia, b: SocialMedia) => a.sort_order - b.sort_order)
                ?.map((link: SocialMedia) => {
                  const IconComponent = getSocialIcon(link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link?.url?.trim()?.replace(/`/g, '') || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                      aria-label={link.name_ar}
                      title={link.name_ar}
                    >
                      <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    </a>
                  );
                })
              }
              {socialMediaLoading && (
                <div className="text-gray-600 text-sm">جاري التحميل...</div>
              )}
            </div>
          </div>

          {/* Horizontal Navigation Categories with Blue Background */}
           <div className="text-center mb-4 sm:mb-6 lg:mb-8">
             {/* Desktop Layout: 2 columns grid */}
             <div className="hidden md:block">
               {/* Line above sections */}
               <div className="w-full h-px bg-blue-600 mb-6"></div>
               
               <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                 {/* Categories Section - Right side */}
                 <div className="text-right">
                   <h3 className="text-blue-600 font-bold text-lg mb-4">تصنيفاتي</h3>
                   <div className="space-y-2">
                     {categoriesLoading ? (
                       <div className="text-blue-600 text-sm">جاري تحميل التصنيفات...</div>
                     ) : (
                       categories.slice(0, 8).map((category) => (
                         <Link 
                           key={category.id} 
                           href={`/category/${category.slug}`}
                           className="block text-blue-600 hover:text-blue-800 text-sm transition-colors duration-200"
                         >
                           {category.name_ar}
                         </Link>
                       ))
                     )}
                   </div>
                 </div>
                 
                 {/* Pages Section - Left side */}
                 <div className="text-right">
                   <h3 className="text-blue-600 font-bold text-lg mb-4">الصفحات</h3>
                   <div className="space-y-2">
                     {quickLinks.map((link, index) => (
                       <Link 
                         key={index} 
                         href={link.href}
                         className="block text-blue-600 hover:text-blue-800 text-sm transition-colors duration-200"
                       >
                         {link.label}
                       </Link>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Mobile Layout: Categories above pages with blue line separator */}
             <div className="md:hidden">
               {/* Categories Section */}
               <div className="mb-6">
                 <h3 className="text-blue-600 font-bold text-lg mb-4 text-center">تصنيفاتي</h3>
                 <div className="flex flex-wrap justify-center gap-2">
                   {categoriesLoading ? (
                     <div className="text-blue-600 text-sm">جاري تحميل التصنيفات...</div>
                   ) : (
                     categories.slice(0, 6).map((category) => (
                       <Link 
                         key={category.id} 
                         href={`/category/${category.slug}`}
                         className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 transition-colors duration-200"
                       >
                         {category.name_ar}
                       </Link>
                     ))
                   )}
                 </div>
               </div>
               
               {/* Blue line separator */}
               <div className="w-full h-px bg-blue-600 mb-6"></div>
               
               {/* Pages Section */}
               <div>
                 <h3 className="text-blue-600 font-bold text-lg mb-4 text-center">الصفحات</h3>
                 <div className="flex flex-wrap justify-center gap-2">
                   {quickLinks.map((link, index) => (
                     <Link 
                       key={index} 
                       href={link.href}
                       className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 transition-colors duration-200"
                     >
                       {link.label}
                     </Link>
                   ))}
                 </div>
               </div>
             </div>
           </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-300 pt-3 sm:pt-4 lg:pt-6 mt-4 sm:mt-6 lg:mt-8">
            <div className="text-center">
              <p className="text-gray-800 text-xs sm:text-sm font-bold leading-relaxed">
                محتوى موقع «مـركـبـا - الـمـنـصـة الاخـبـاريـة» متوفر تحت رخصة المشاع الإبداعي  2025©
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 sm:bottom-6 lg:bottom-8 right-4 sm:right-6 lg:right-8 rtl:right-auto rtl:left-4 sm:rtl:left-6 lg:rtl:left-8 z-50 w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          aria-label="العودة إلى الأعلى"
        >
          <FiArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" />
        </button>
      )}
    </>
  );
};

export default Footer;