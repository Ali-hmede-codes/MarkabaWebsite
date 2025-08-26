import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FiSearch, FiMenu, FiX } from 'react-icons/fi';
import { MdSportsSoccer } from 'react-icons/md';
import { FiPlay } from 'react-icons/fi';
import { SiFacebook, SiTwitter, SiInstagram, SiYoutube, SiLinkedin, SiTelegram, SiWhatsapp, SiTiktok } from 'react-icons/si';
import { useContent } from '../../hooks/useContent';
import { useSettingsContext } from '../../context/SettingsContext';
import { useCategories, useSocialMedia } from '../API/hooks';
import type { SocialMedia } from '../API/types';
import SearchModal from '../Search/SearchModal';

const Header: React.FC = () => {
  const { content } = useContent();
  const { getSetting } = useSettingsContext();
  const { data: categoriesData, loading: categoriesLoading } = useCategories();
  const { data: socialMediaData, loading: socialMediaLoading } = useSocialMedia();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get categories from API or fallback to static content
  const categories = categoriesData?.categories || [];
  
  // Get social media from API
  const socialMediaLinks: SocialMedia[] = (socialMediaData && Array.isArray(socialMediaData)) ? socialMediaData : [];
  
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
  
  // Get logo from database settings
  const logoUrl = getSetting('site_logo', 'ar') || '/images/logo_new.png';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!content) return null;

  // Split categories for dropdown system
  const visibleCategories = categories.slice(0, 6);
  const hiddenCategories = categories.slice(6);
  
  // Add custom "بالفيديو" category to hidden categories
  const customVideoCategory = {
    id: 'videos',
    name_ar: 'بالفيديو',
    slug: 'videos'
  };
  
  const hiddenCategoriesWithVideo = [...hiddenCategories, customVideoCategory];
  const hasMoreCategories = hiddenCategoriesWithVideo.length > 0;

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50" dir="rtl">

      {/* Main Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center py-2 lg:py-3">
            {/* Logo and Site Info */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="relative group">
                <div className="h-16 w-20 lg:h-20 lg:w-24 flex items-center justify-center relative">
                  {logoUrl ? (
                    <Image
                          src={logoUrl}
                          alt={content?.site?.name || 'Logo'}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-110"
                          priority
                          quality={100}
                          sizes="(max-width: 768px) 80px, 96px"
                        />
                  ) : (
                    <span className="text-blue-600 font-bold text-3xl lg:text-4xl">م</span>
                  )}
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
              </div>
            </div>

            {/* Desktop Categories Navigation */}
            <div className="hidden md:flex items-center space-x-6 rtl:space-x-reverse flex-1 justify-center">
              {/* Visible Categories (first 7) */}
              {visibleCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="relative px-3 py-2 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium whitespace-nowrap group"
                >
                  {category.name_ar}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
                </Link>
              ))}
              
              
              {/* More Categories Dropdown */}
              {hasMoreCategories && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="relative px-3 py-2 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium group flex items-center space-x-1 rtl:space-x-reverse"
                  >
                    <span>المزيد</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-200 group-hover:w-full"></span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                      {hiddenCategoriesWithVideo.map((category) => (
                        <Link
                          key={category.id}
                          href={category.slug === 'videos' ? '/videos' : `/category/${category.slug}`}
                          className={`block px-4 py-2 transition-all duration-200 font-medium ${
                            category.slug === 'videos' 
                              ? 'text-green-700 hover:text-green-800 hover:bg-green-50 flex items-center gap-2'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          {category.slug === 'videos' && <FiPlay size={16} />}
                          {category.name_ar}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {categoriesLoading && (
                <div className="px-3 py-2 text-gray-400 text-sm">
                  جاري التحميل...
                </div>
              )}
            </div>

            {/* Desktop Search Button, Football Button and Social Media */}
            <div className="hidden md:flex items-center space-x-3 rtl:space-x-reverse">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                aria-label="البحث"
              >
                <FiSearch size={20} />
              </button>
              
              {/* Football Button */}
              <Link href="/football">
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  aria-label="كرة القدم"
                >
                  <MdSportsSoccer size={20} />
                </button>
              </Link>



              {/* Social Media Icons */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                {socialMediaLinks
                  .filter((link: SocialMedia) => Boolean(link.is_active))
                  ?.sort((a: SocialMedia, b: SocialMedia) => a.sort_order - b.sort_order)
                  ?.map((link: SocialMedia) => {
                    const IconComponent = getSocialIcon(link.platform);
                    return (
                      <a
                        key={link.id}
                        href={link.url.trim().replace(/`/g, '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 hover:scale-110 transition-all duration-200 p-2 rounded-full hover:bg-blue-50"
                        title={link.name_ar}
                      >
                        <IconComponent size={16} />
                      </a>
                    );
                  })
                }
                {socialMediaLoading && (
                  <div className="text-gray-400 text-xs">جاري التحميل...</div>
                )}
              </div>
            </div>

            {/* Mobile Search, Football and Menu Buttons */}
            <div className="md:hidden flex items-center space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                aria-label="البحث"
              >
                <FiSearch size={22} className="drop-shadow-sm" />
              </button>
              
              {/* Football Button */}
              <Link href="/football">
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  aria-label="كرة القدم"
                >
                  <MdSportsSoccer size={22} />
                </button>
              </Link>
              

              <button
                onClick={toggleMenu}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              >
                {isMenuOpen ? <FiX size={22} className="drop-shadow-sm" /> : <FiMenu size={22} className="drop-shadow-sm" />}
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {/* Categories */}
            <div className="space-y-2 border-t border-gray-100 pt-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">الأقسام</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="block px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm font-medium text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name_ar}
                  </Link>
                ))}
                
                {/* Video Category */}
                <Link
                  href="/videos"
                  className="flex items-center justify-center px-3 py-2 rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 text-sm font-medium border border-green-200 hover:border-green-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiPlay size={14} className="ml-1" />
                  بالفيديو
                </Link>
                

                {categoriesLoading && (
                  <div className="col-span-2 px-3 py-2 text-sm text-gray-400 text-center">
                    جاري تحميل الأقسام...
                  </div>
                )}
                {!categoriesLoading && categories.length === 0 && (
                  <div className="col-span-2 px-3 py-2 text-sm text-gray-400 text-center">
                    لا توجد أقسام متاحة
                  </div>
                )}
              </div>
            </div>

            {/* Social Media in Mobile Menu */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">وسائل التواصل الاجتماعي</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {socialMediaLinks
                  .filter((link: SocialMedia) => Boolean(link.is_active))
                  .sort((a: SocialMedia, b: SocialMedia) => a.sort_order - b.sort_order)
                  .map((link: SocialMedia) => {
                    const IconComponent = getSocialIcon(link.platform);
                    return (
                      <a
                        key={link.id}
                        href={link.url.trim().replace(/`/g, '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 transition-all duration-200 p-2 rounded-full hover:bg-blue-50"
                        title={link.name_ar}
                      >
                        <IconComponent size={20} />
                      </a>
                    );
                  })
                }
                {socialMediaLoading && (
                  <div className="text-gray-400 text-sm">جاري التحميل...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />
    </header>
  );
};

export default Header;