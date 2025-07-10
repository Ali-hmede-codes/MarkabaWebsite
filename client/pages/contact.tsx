'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/context/ThemeContext';
import { useSettingsContext } from '@/context/SettingsContext';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}

const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();
  const { getSetting } = useSettingsContext();
  
  // Get dynamic content from settings
  const contactTitle = getSetting(theme.language === 'ar' ? 'contact_title_ar' : 'contact_title');
  const contactContent = getSetting(theme.language === 'ar' ? 'contact_content_ar' : 'contact_content');
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the data to your backend
      console.log('Contact form data:', data);
      
      toast.success(
        theme.language === 'ar' 
          ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً'
          : 'Your message has been sent successfully! We will contact you soon'
      );
      
      reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(
        theme.language === 'ar' 
          ? 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى'
          : 'An error occurred while sending the message. Please try again'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: theme.language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: 'info@newswebsite.com',
      link: 'mailto:info@newswebsite.com'
    },
    {
      icon: PhoneIcon,
      title: theme.language === 'ar' ? 'الهاتف' : 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567'
    },
    {
      icon: MapPinIcon,
      title: theme.language === 'ar' ? 'العنوان' : 'Address',
      value: theme.language === 'ar' 
        ? '123 شارع الأخبار، المدينة، البلد'
        : '123 News Street, City, Country',
      link: null
    },
    {
      icon: ClockIcon,
      title: theme.language === 'ar' ? 'ساعات العمل' : 'Working Hours',
      value: theme.language === 'ar' 
        ? 'الأحد - الخميس: 9:00 ص - 6:00 م'
        : 'Sunday - Thursday: 9:00 AM - 6:00 PM',
      link: null
    }
  ];

  const departments = [
    {
      name: theme.language === 'ar' ? 'التحرير' : 'Editorial',
      email: 'editorial@newswebsite.com',
      description: theme.language === 'ar' 
        ? 'للأخبار والمقالات والمحتوى التحريري'
        : 'For news, articles, and editorial content'
    },
    {
      name: theme.language === 'ar' ? 'الإعلانات' : 'Advertising',
      email: 'ads@newswebsite.com',
      description: theme.language === 'ar' 
        ? 'للاستفسارات حول الإعلانات والشراكات'
        : 'For advertising inquiries and partnerships'
    },
    {
      name: theme.language === 'ar' ? 'الدعم التقني' : 'Technical Support',
      email: 'support@newswebsite.com',
      description: theme.language === 'ar' 
        ? 'للمساعدة التقنية ومشاكل الموقع'
        : 'For technical assistance and website issues'
    },
    {
      name: theme.language === 'ar' ? 'العلاقات العامة' : 'Public Relations',
      email: 'pr@newswebsite.com',
      description: theme.language === 'ar' 
        ? 'للعلاقات الإعلامية والشراكات'
        : 'For media relations and partnerships'
    }
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: theme.language === 'ar' ? 'تواصل معنا - موقع الأخبار' : 'Contact Us - News Website',
    description: theme.language === 'ar' 
      ? 'تواصل مع فريق موقع الأخبار للاستفسارات والاقتراحات والدعم التقني'
      : 'Contact the News Website team for inquiries, suggestions, and technical support',
    url: typeof window !== 'undefined' ? window.location.href : '',
    mainEntity: {
      '@type': 'Organization',
      name: theme.language === 'ar' ? 'موقع الأخبار' : 'News Website',
      email: 'info@newswebsite.com',
      telephone: '+15551234567',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 News Street',
        addressLocality: 'City',
        addressCountry: 'Country'
      }
    }
  };

  return (
    <>
      <Head>
        <title>
          {theme.language === 'ar' ? 'تواصل معنا - موقع الأخبار' : 'Contact Us - News Website'}
        </title>
        <meta 
          name="description" 
          content={theme.language === 'ar' 
            ? 'تواصل مع فريق موقع الأخبار للاستفسارات والاقتراحات والدعم التقني. نحن هنا لخدمتكم'
            : 'Contact the News Website team for inquiries, suggestions, and technical support. We are here to serve you'
          } 
        />
        <meta 
          name="keywords" 
          content={theme.language === 'ar' 
            ? 'تواصل معنا، اتصال، استفسارات، دعم، موقع الأخبار'
            : 'contact us, contact, inquiries, support, news website'
          } 
        />
        
        {/* Open Graph */}
        <meta 
          property="og:title" 
          content={theme.language === 'ar' ? 'تواصل معنا - موقع الأخبار' : 'Contact Us - News Website'} 
        />
        <meta 
          property="og:description" 
          content={theme.language === 'ar' 
            ? 'تواصل مع فريق موقع الأخبار للاستفسارات والاقتراحات والدعم التقني. نحن هنا لخدمتكم'
            : 'Contact the News Website team for inquiries, suggestions, and technical support. We are here to serve you'
          } 
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta 
          name="twitter:title" 
          content={theme.language === 'ar' ? 'تواصل معنا - موقع الأخبار' : 'Contact Us - News Website'} 
        />
        <meta 
          name="twitter:description" 
          content={theme.language === 'ar' 
            ? 'تواصل مع فريق موقع الأخبار للاستفسارات والاقتراحات والدعم التقني. نحن هنا لخدمتكم'
            : 'Contact the News Website team for inquiries, suggestions, and technical support. We are here to serve you'
          } 
        />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400">
                {theme.language === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">
              {theme.language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {contactTitle || (theme.language === 'ar' ? 'تواصل معنا' : 'Contact Us')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {contactContent || (theme.language === 'ar' 
              ? 'نحن نقدر تواصلكم معنا ونرحب بآرائكم واقتراحاتكم. فريقنا جاهز لمساعدتكم والإجابة على استفساراتكم'
              : 'We value your communication with us and welcome your opinions and suggestions. Our team is ready to help you and answer your inquiries'
            )}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {theme.language === 'ar' ? 'أرسل رسالة' : 'Send a Message'}
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {theme.language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register('name', {
                        required: theme.language === 'ar' ? 'الاسم مطلوب' : 'Name is required',
                        minLength: {
                          value: 2,
                          message: theme.language === 'ar' ? 'الاسم يجب أن يكون أكثر من حرفين' : 'Name must be at least 2 characters'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder={theme.language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {theme.language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email', {
                        required: theme.language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: theme.language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder={theme.language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div>
                    <label 
                      htmlFor="phone" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {theme.language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder={theme.language === 'ar' ? 'أدخل رقم هاتفك (اختياري)' : 'Enter your phone number (optional)'}
                    />
                  </div>
                  
                  {/* Subject */}
                  <div>
                    <label 
                      htmlFor="subject" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      {theme.language === 'ar' ? 'الموضوع' : 'Subject'} *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      {...register('subject', {
                        required: theme.language === 'ar' ? 'الموضوع مطلوب' : 'Subject is required',
                        minLength: {
                          value: 5,
                          message: theme.language === 'ar' ? 'الموضوع يجب أن يكون أكثر من 5 أحرف' : 'Subject must be at least 5 characters'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder={theme.language === 'ar' ? 'أدخل موضوع الرسالة' : 'Enter message subject'}
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Message */}
                <div>
                  <label 
                    htmlFor="message" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {theme.language === 'ar' ? 'الرسالة' : 'Message'} *
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    {...register('message', {
                      required: theme.language === 'ar' ? 'الرسالة مطلوبة' : 'Message is required',
                      minLength: {
                        value: 10,
                        message: theme.language === 'ar' ? 'الرسالة يجب أن تكون أكثر من 10 أحرف' : 'Message must be at least 10 characters'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    placeholder={theme.language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.message.message}
                    </p>
                  )}
                </div>
                
                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
                        {theme.language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {theme.language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
              </h2>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4 rtl:space-x-reverse">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {info.title}
                        </h3>
                        {info.link ? (
                          <a 
                            href={info.link}
                            className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-400">
                            {info.value}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Departments */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {theme.language === 'ar' ? 'الأقسام' : 'Departments'}
              </h2>
              
              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {dept.name}
                    </h3>
                    <a 
                      href={`mailto:${dept.email}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline text-sm mb-1 block"
                    >
                      {dept.email}
                    </a>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {dept.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;