'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '../API/types';

interface CategoryCardProps {
  category: Category;
  className?: string;
  showDescription?: boolean;
  showPostCount?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  className = '',
  showDescription = true,
  showPostCount = true
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${className}`}>
      {/* Category Image */}
      {category.image && (
        <div className="relative h-32 w-full">
          <Image
            src={category.image}
            alt={category.name_ar}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Category Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          <Link 
            href={`/categories/${category.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {category.name_ar}
          </Link>
        </h3>
        
        {/* Description */}
        {showDescription && category.description_ar && (
          <p className="text-gray-600 text-sm mt-2" dir="rtl">
            {category.description_ar}
          </p>
        )}
        
        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {showPostCount && (
            <span>
              {category.posts_count || 0} {(category.posts_count || 0) === 1 ? 'post' : 'posts'}
            </span>
          )}
          
          {category.color && (
            <div 
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: category.color }}
              title={`Category color: ${category.color}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;