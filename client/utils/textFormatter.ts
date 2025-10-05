/**
 * Utility functions for formatting post content text
 */

/**
 * Formats post content by converting special patterns to styled HTML
 * @param content - The raw post content
 * @returns Formatted HTML string with styled elements
 */
export const formatPostContent = (content: string): string => {
  if (!content) return '';
  
  // First, replace line breaks with <br> tags
  let formattedContent = content.replace(/\n/g, '<br>');
  
  // Convert *text* patterns to bold subtitles
  formattedContent = formattedContent.replace(
    /\*([^*]+)\*/g,
    '<div class="subtitle-formatted" style="font-weight: bold; font-size: 1.2em; margin: 1.5em 0 1em 0; color: #1f2937; line-height: 1.4;">$1</div>'
  );
  
  // Convert _text_ patterns to red colored text
  formattedContent = formattedContent.replace(
    /_([^_]+)_/g,
    '<span class="red-text-formatted" style="color: #dc2626; font-weight: 500;">$1</span>'
  );
  
  // Convert %text% patterns to bold text
  formattedContent = formattedContent.replace(
    /%([^%]+)%/g,
    '<strong class="bold-text-formatted" style="font-weight: bold;">$1</strong>'
  );
  
  // Convert $text$ patterns to blue quote with icon
  formattedContent = formattedContent.replace(
    /\$([^$]+)\$/g,
    '<div class="quote-formatted" style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; margin: 1.5rem 0; border-radius: 0.5rem; position: relative; color: #1e40af; font-style: italic; line-height: 1.6;"><div style="display: flex; align-items: flex-start; gap: 0.5rem;"><svg style="width: 1.25rem; height: 1.25rem; color: #3b82f6; flex-shrink: 0; margin-top: 0.125rem;" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/></svg><span>$1</span></div></div>'
  );
  
  return formattedContent;
};

/**
 * Formats post content for admin preview (without HTML)
 * @param content - The raw post content
 * @returns Plain text with formatting indicators
 */
export const formatPostContentPreview = (content: string): string => {
  if (!content) return '';
  
  // Keep formatting symbols for admin preview to show formatting
  return content;
};

/**
 * Extracts plain text from formatted content (removes HTML and formatting)
 * @param content - The formatted content
 * @returns Plain text content
 */
export const extractPlainText = (content: string): string => {
  if (!content) return '';
  
  // Remove HTML tags and convert back to plain text
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\*([^*]+)\*/g, '$1') // Remove asterisks but keep text
    .replace(/_([^_]+)_/g, '$1') // Remove underscores but keep text
    .replace(/%([^%]+)%/g, '$1') // Remove percent signs but keep text
    .replace(/\$([^$]+)\$/g, '$1') // Remove dollar signs but keep text
    .replace(/<br>/g, '\n') // Convert <br> back to line breaks
    .trim();
};