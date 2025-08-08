/**
 * Utility functions for formatting post content text
 */

/**
 * Formats post content by converting *text* patterns to bold subtitles
 * @param content - The raw post content
 * @returns Formatted HTML string with subtitles
 */
export const formatPostContent = (content: string): string => {
  if (!content) return '';
  
  // First, replace line breaks with <br> tags
  let formattedContent = content.replace(/\n/g, '<br>');
  
  // Convert *text* patterns to bold subtitles
  // This regex matches text between asterisks that are not at the start/end of words
  formattedContent = formattedContent.replace(
    /\*([^*]+)\*/g,
    '<div class="subtitle-formatted" style="font-weight: bold; font-size: 1.2em; margin: 1.5em 0 1em 0; color: #1f2937; line-height: 1.4;">$1</div>'
  );
  
  return formattedContent;
};

/**
 * Formats post content for admin preview (without HTML)
 * @param content - The raw post content
 * @returns Plain text with subtitle indicators
 */
export const formatPostContentPreview = (content: string): string => {
  if (!content) return '';
  
  // Keep asterisks for admin preview to show subtitle formatting
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
    .replace(/<br>/g, '\n') // Convert <br> back to line breaks
    .trim();
};