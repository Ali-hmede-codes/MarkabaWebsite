export { default as AdDisplay } from './AdDisplay';
export { default as HeaderBannerAd } from './HeaderBannerAd';
export { default as SidebarAd } from './SidebarAd';
export { default as PostContentAd } from './PostContentAd';
export { default as PostSidebarAd } from './PostSidebarAd';
export { default as FooterBannerAd } from './FooterBannerAd';

// Export types if needed
export interface AdPosition {
  header_banner: 'header_banner';
  sidebar: 'sidebar';
  post_content: 'post_content';
  post_sidebar: 'post_sidebar';
  footer_banner: 'footer_banner';
}

export const AD_POSITIONS = {
  HEADER_BANNER: 'header_banner',
  SIDEBAR: 'sidebar',
  POST_CONTENT: 'post_content',
  POST_SIDEBAR: 'post_sidebar',
  FOOTER_BANNER: 'footer_banner'
} as const;

export type AdPositionType = typeof AD_POSITIONS[keyof typeof AD_POSITIONS];