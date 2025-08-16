export { default as AdDisplay } from './AdDisplay';
export { default as MainTopAd } from './MainTopAd';
export { default as MiddleMainAd } from './MiddleMainAd';
export { default as BottomMainAd } from './BottomMainAd';
export { default as PostBottomAd } from './PostBottomAd';
export { default as SquarePostMiddleAd } from './SquarePostMiddleAd';
export { default as SidebarTopAd } from './SidebarTopAd';
export { default as SidebarMiddleAd } from './SidebarMiddleAd';

// Export types matching our database positions
export interface AdPosition {
  main_top: 'main_top';
  middle_main: 'middle_main';
  bottom_main: 'bottom_main';
  post_bottom: 'post_bottom';
  square_post_middle: 'square_post_middle';
  sidebar_top: 'sidebar_top';
  sidebar_middle: 'sidebar_middle';
}

export const AD_POSITIONS = {
  MAIN_TOP: 'main_top',
  MIDDLE_MAIN: 'middle_main',
  BOTTOM_MAIN: 'bottom_main',
  POST_BOTTOM: 'post_bottom',
  SQUARE_POST_MIDDLE: 'square_post_middle',
  SIDEBAR_TOP: 'sidebar_top',
  SIDEBAR_MIDDLE: 'sidebar_middle'
} as const;

export type AdPositionType = typeof AD_POSITIONS[keyof typeof AD_POSITIONS];