'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Post } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface SearchResult {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    posts: [],
    loading: false,
    error: null
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ posts: [], loading: false, error: null });
      return;
    }

    setResults(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults({
        posts: data.data || [],
        loading: false,
        error: null
      });
    } catch (error) {
      setResults({
        posts: [],
        loading: false,
        error: 'Search failed. Please try again.'
      });
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Save search to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div 
          ref={modalRef}
          className={`relative w-full max-w-2xl bg-white rounded-lg shadow-xl ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Search</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="p-4 border-b">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, categories, or topics..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
          
          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Searches</h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Loading */}
            {results.loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* Error */}
            {results.error && (
              <div className="p-4 text-center text-red-600">
                {results.error}
              </div>
            )}
            
            {/* Results */}
            {query && !results.loading && !results.error && (
              <div className="p-4">
                {results.posts.length > 0 ? (
                  <>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Found {results.posts.length} result{results.posts.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="space-y-3">
                      {results.posts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.slug}`}
                          onClick={() => {
                            saveRecentSearch(query);
                            onClose();
                          }}
                          className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                          )}
                          {post.category && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {post.category.name_ar}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No results found for "{query}"
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {query && (
            <div className="p-4 border-t bg-gray-50">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => {
                  saveRecentSearch(query);
                  onClose();
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all results for "{query}" →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;