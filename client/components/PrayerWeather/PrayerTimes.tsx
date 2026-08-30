import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiBook } from 'react-icons/fi';

interface PrayerTimesData {
  Fajr: string;
  Duha: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerTimesResponse {
  success: boolean;
  data: {
    results: PrayerTimesData;
  };
  message?: string;
}

const PrayerTimes: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format prayer times with Arabic AM/PM
  const formatPrayerTime = (time: string) => {
    return time
      .replace(/%am%/g, 'صباحاً')
      .replace(/%pm%/g, 'مساءً');
  };

  // Helper function to translate prayer names to Arabic
  const translatePrayerName = (name: string) => {
    const translations: { [key: string]: string } = {
      'Fajr': 'الفجر',
      'Duha': 'الضحى',
      'Dhuhr': 'الظهر',
      'Asr': 'العصر',
      'Maghrib': 'المغرب',
      'Isha': 'العشاء'
    };
    return translations[name] || name;
  };

  // Helper function to get Hijri date
  const getHijriDate = () => {
    const hijriMonths = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    
    const gregorianToHijri = (date: Date) => {
      const julianDay = Math.floor((date.getTime() / 86400000) + 2440587.5);
      const hijriEpoch = 1948439.5;
      const daysSinceHijriEpoch = julianDay - hijriEpoch;
      
      const hijriYear = Math.floor(daysSinceHijriEpoch / 354.367) + 1;
      const dayOfYear = Math.floor(daysSinceHijriEpoch % 354.367);
      
      const hijriMonth = Math.floor(dayOfYear / 29.5);
      const hijriDay = Math.floor(dayOfYear % 29.5) + 1;
      
      return {
        year: hijriYear,
        month: Math.min(hijriMonth, 11),
        day: Math.max(1, Math.min(hijriDay, 30))
      };
    };
    
    const now = new Date();
    const hijriDate = gregorianToHijri(now);
    
    return `${hijriDate.day} ${hijriMonths[hijriDate.month]} ${hijriDate.year}هـ`;
  };

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const response = await axios.get<PrayerTimesResponse>('/api/v2/prayer/today');
        if (response.data.success) {
          setPrayerTimes(response.data.data.results);
        } else {
          setError(response.data.message || 'فشل في جلب مواقيت الصلاة');
        }
      } catch (err) {
        console.error('Error fetching prayer times:', err);
        setError('خطأ في جلب مواقيت الصلاة. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <FiBook className="text-green-600 ml-2" size={20} />
          <h3 className="text-xl font-bold text-gray-800">مواقيت الصلاة</h3>
        </div>
        <div className="text-center py-4 text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <FiBook className="text-green-600 ml-2" size={20} />
          <h3 className="text-xl font-bold text-gray-800">مواقيت الصلاة</h3>
        </div>
        <div className="text-center py-4 text-red-500">{error}</div>
      </div>
    );
  }

  if (!prayerTimes) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <FiBook className="text-green-600 ml-2" size={20} />
          <h3 className="text-xl font-bold text-gray-800">مواقيت الصلاة</h3>
        </div>
        <div className="text-center py-4 text-gray-600">لا توجد مواقيت متاحة حالياً</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <FiBook className="text-green-600 ml-2" size={20} />
        <h3 className="text-xl font-bold text-gray-800">مواقيت الصلاة</h3>
      </div>
      <div className="text-center mb-4">
        <div className="text-sm text-gray-600">{getHijriDate()}</div>
      </div>
      <div className="space-y-2">
        {Object.entries(prayerTimes).map(([name, time]) => (
          <div key={name} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <span className="font-medium text-gray-700">{translatePrayerName(name)}</span>
            <span className="text-green-600 font-bold">{formatPrayerTime(time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrayerTimes;