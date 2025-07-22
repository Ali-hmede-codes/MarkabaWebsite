import React, { useState, useRef } from 'react';
import { FiUpload, FiImage, FiSave, FiX } from 'react-icons/fi';
import { useSettingsContext } from '../../context/SettingsContext';
// import Image from 'next/image'; // Removed to fix CORS issues

interface LogoSettingsProps {
  onClose?: () => void;
}

const LogoSettings: React.FC<LogoSettingsProps> = ({ onClose }) => {
  const { getSetting, refetch } = useSettingsContext();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentLogo = getSetting('site_logo', 'ar') || '/uploads/logo.svg';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة صالح');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. يرجى اختيار صورة أصغر من 2 ميجابايت');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'logo');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('فشل في رفع الصورة');
      }
      
      const data = await response.json();
      
      // Update logo setting in database
      await updateLogoSetting(data.filePath);
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('حدث خطأ أثناء رفع الشعار');
    } finally {
      setIsUploading(false);
    }
  };
  
  const updateLogoSetting = async (logoPath: string) => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: 'site_logo',
          setting_value_ar: logoPath,
        }),
      });
      
      if (!response.ok) {
        throw new Error('فشل في تحديث إعدادات الشعار');
      }
      
      // Refresh settings
      await refetch();
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      alert('تم تحديث الشعار بنجاح!');
      
    } catch (error) {
      console.error('Error updating logo setting:', error);
      alert('حدث خطأ أثناء تحديث الشعار');
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetToDefault = async () => {
    if (confirm('هل أنت متأكد من إعادة تعيين الشعار إلى الافتراضي؟')) {
      await updateLogoSetting('/uploads/logo.svg');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">إعدادات الشعار</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        )}
      </div>
      
      {/* Current Logo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الشعار الحالي
        </label>
        <div className="flex justify-center p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
          <div className="w-16 h-16 relative">
            <img
              src={currentLogo}
              alt="الشعار الحالي"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          رفع شعار جديد
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="logo-upload"
          />
          <label
            htmlFor="logo-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <FiImage size={32} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              اضغط لاختيار صورة أو اسحبها هنا
            </span>
            <span className="text-xs text-gray-400 mt-1">
              PNG, JPG, SVG (حد أقصى 2MB)
            </span>
          </label>
        </div>
      </div>
      
      {/* Preview */}
      {previewUrl && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            معاينة الشعار الجديد
          </label>
          <div className="flex justify-center p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <div className="w-16 h-16 relative">
              <img
                src={previewUrl}
                alt="معاينة الشعار"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || isSaving}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isUploading || isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FiUpload size={16} />
          )}
          {isUploading ? 'جاري الرفع...' : isSaving ? 'جاري الحفظ...' : 'رفع وحفظ'}
        </button>
        
        <button
          onClick={resetToDefault}
          disabled={isSaving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          إعادة تعيين
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        سيتم تطبيق الشعار الجديد على جميع صفحات الموقع فوراً
      </div>
    </div>
  );
};

export default LogoSettings;