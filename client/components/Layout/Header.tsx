import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FiSearch, FiMenu, FiX } from 'react-icons/fi';
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

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50" dir="rtl">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white py-2 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4 rtl:space-x-reverse animate-fade-in">
            <span className="font-medium bg-white/10 px-3 py-1 rounded-full text-sm">
              {new Date().toLocaleDateString('ar-SA-u-ca-gregory', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-blue-200 hidden sm:inline">|</span>
            <span className="font-mono text-blue-100 text-sm">
              {new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Social Media Icons */}
            <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
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
                      className="text-white hover:text-blue-200 hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-white/10"
                      title={link.name_ar}
                      style={{ color: link.color || 'white' }}
                    >
                      <IconComponent size={14} />
                    </a>
                  );
                })
              }
              {socialMediaLoading && (
                <div className="text-white/60 text-xs">جاري التحميل...</div>
              )}
            </div>
            <span className="text-blue-200 hidden sm:inline">|</span>
            <div className="flex items-center space-x-2 rtl:space-x-reverse bg-red-500/20 px-3 py-1 rounded-full border border-red-400/30">
              <span className="text-xs font-bold text-red-100">{content.navigation?.breaking_news || 'أخبار عاجلة'}</span>
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-6">
            {/* Logo and Site Info */}
            <div className="flex items-center space-x-3 lg:space-x-4 rtl:space-x-reverse">
              <div className="relative group">
                <div className="h-8 w-8 lg:h-10 lg:w-10 flex items-center justify-center"> {/* Adjust h- and w- values here to change logo size easily */}
                  {logoUrl ? (
                    <Image
                          src={logoUrl}
                          alt={content?.site?.name || 'Logo'}
                          layout="fill"
                          objectFit="contain"
                          className="transition-transform duration-300 group-hover:scale-110"
                          priority
                        />
                  ) : (
                    <span className="text-[#363636] md:text-blue-800 font-bold text-base lg:text-lg">م</span>
                  )}
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl lg:text-3xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200">
                  {content.site.name}
                </h1>
                <p className="text-xs lg:text-sm text-gray-500 font-medium">
                  {content.site.tagline}
                </p>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch}>
                <div className="relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={content.common.search_placeholder}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 group-hover:bg-gray-100 text-right"
                    dir="rtl"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  >
                    <FiSearch size={20} />
                  </button>
                </div>
              </form>
            </div>

            {/* Mobile Search and Menu Buttons */}
            <div className="md:hidden flex items-center space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                aria-label="البحث"
              >
                <FiSearch size={22} className="drop-shadow-sm" />
              </button>
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

      {/* Professional Navigation Bar */}
      <nav className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="hidden md:flex justify-between items-center py-2 lg:py-3">
            {/* Main Navigation Links */}
            <div className="flex space-x-1 rtl:space-x-reverse">
              <Link
                href="/"
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-white/80 transition-all duration-200 font-medium border border-transparent hover:border-blue-200 hover:shadow-sm"
              >
                {content.navigation?.home || 'الرئيسية'}
              </Link>
              <Link
                href="/about"
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-white/80 transition-all duration-200 font-medium border border-transparent hover:border-blue-200 hover:shadow-sm"
              >
                {content.navigation?.about || 'من نحن'}
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-white/80 transition-all duration-200 font-medium border border-transparent hover:border-blue-200 hover:shadow-sm"
              >
                {content.navigation?.contact || 'اتصل بنا'}
              </Link>
            </div>

            {/* Category Links - Show all categories with responsive sizing */}
            <div className="flex flex-wrap gap-1 rtl:space-x-reverse">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="px-2 xl:px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-xs xl:text-sm font-medium border border-transparent hover:border-blue-200 whitespace-nowrap"
                >
                  {category.name_ar}
                </Link>
              ))}
              {categoriesLoading && (
                <div className="px-2 xl:px-3 py-2 text-xs xl:text-sm text-gray-400">
                  جاري التحميل...
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
              <div className="px-4 py-4 space-y-3">
                {/* Main Navigation Links */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">القائمة الرئيسية</h3>
                  <Link
                    href="/"
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {content.navigation?.home || 'الرئيسية'}
                  </Link>
                  <Link
                    href="/about"
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {content.navigation?.about || 'من نحن'}
                  </Link>
                  <Link
                    href="/contact"
                    className="block px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {content.navigation?.contact || 'اتصل بنا'}
                  </Link>
                </div>
                
                {/* Categories */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
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
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">وسائل التواصل الاجتماعي</h3>
                  <div className="flex flex-wrap justify-center gap-4">
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
                            className="text-[#363636] hover:text-blue-600 hover:scale-110 transition-all duration-200 p-2 rounded-full hover:bg-blue-50"
                            title={link.name_ar}
                          >
                            <IconComponent size={24} />
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
        </div>
      </nav>
      
      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
      />
    </header>
  );
};

export default Header;