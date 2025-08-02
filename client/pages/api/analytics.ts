import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Initialize the Analytics Data API client
let analyticsDataClient: BetaAnalyticsDataClient | null = null;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_ANALYTICS_PRIVATE_KEY) {
  try {
    // Initialize with service account credentials
    if (process.env.GOOGLE_ANALYTICS_PRIVATE_KEY) {
      analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_ANALYTICS_PROJECT_ID,
      });
    } else {
      analyticsDataClient = new BetaAnalyticsDataClient();
    }
  } catch (error) {
    console.error('Failed to initialize Analytics Data API client:', error);
  }
}

interface AnalyticsResponse {
  totalUsers: number;
  pageViews: number;
  sessionsToday: number;
  avgSessionDuration: string;
  totalPosts: number;
  totalCategories: number;
  realTimeUsers?: number;
  topPages?: Array<{ page: string; views: number }>;
  isRealData?: boolean;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as any);
  }

  try {
    // Fetch posts and categories count from existing APIs
    const [postsResponse, categoriesResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
    ]);

    const postsData = await postsResponse.json();
    const categoriesData = await categoriesResponse.json();

    let analyticsData: Partial<AnalyticsResponse> = {
      totalPosts: postsData.posts ? postsData.posts.length : 0,
      totalCategories: categoriesData.categories ? categoriesData.categories.length : 0,
    };

    // Check if Google Analytics Data API is properly configured
    const isApiConfigured = analyticsDataClient && 
                           process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL && 
                           process.env.GOOGLE_ANALYTICS_PRIVATE_KEY && 
                           process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

    if (isApiConfigured && analyticsDataClient && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
      try {
        const propertyId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID.replace('G-', '');
        
        // Fetch analytics data for the last 7 days
        const [response] = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [
            {
              startDate: '7daysAgo',
              endDate: 'today',
            },
          ],
          metrics: [
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
          ],
          dimensions: [],
        });

        // Fetch today's sessions
        const [todayResponse] = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [
            {
              startDate: 'today',
              endDate: 'today',
            },
          ],
          metrics: [
            { name: 'sessions' },
          ],
        });

        // Parse the response
        if (response.rows && response.rows.length > 0) {
          const row = response.rows[0];
          analyticsData.totalUsers = parseInt(row.metricValues?.[0]?.value || '0');
          analyticsData.pageViews = parseInt(row.metricValues?.[1]?.value || '0');
          
          const avgDurationSeconds = parseFloat(row.metricValues?.[3]?.value || '0');
          const minutes = Math.floor(avgDurationSeconds / 60);
          const seconds = Math.floor(avgDurationSeconds % 60);
          analyticsData.avgSessionDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        if (todayResponse.rows && todayResponse.rows.length > 0) {
          analyticsData.sessionsToday = parseInt(todayResponse.rows[0].metricValues?.[0]?.value || '0');
        }

        // Mark as real data
        (analyticsData as any).isRealData = true;

      } catch (analyticsError) {
        console.error('Error fetching Firebase Analytics data:', analyticsError);
        // Fall back to simulated data if Analytics API fails
        analyticsData = {
          ...analyticsData,
          ...getSimulatedData(),
          isRealData: false,
          error: 'Analytics API error'
        };
      }
    } else {
      // Use simulated data if Analytics API is not configured
      console.log('Google Analytics Data API not configured, using simulated data');
      analyticsData = {
        ...analyticsData,
        ...getSimulatedData(),
        isRealData: false,
        error: 'API not configured'
      };
    }

    res.status(200).json(analyticsData as AnalyticsResponse);
  } catch (error) {
    console.error('Error in analytics API:', error);
    res.status(500).json({ error: 'Internal server error' } as any);
  }
}

function getSimulatedData() {
  const currentHour = new Date().getHours();
  const baseUsers = 1250;
  const dailyVariation = Math.floor(Math.random() * 200) + 50;
  
  return {
    totalUsers: baseUsers + dailyVariation,
    pageViews: Math.floor((baseUsers + dailyVariation) * 2.7) + Math.floor(Math.random() * 500),
    sessionsToday: Math.floor((baseUsers + dailyVariation) * 0.08) + Math.floor(Math.random() * 30),
    avgSessionDuration: `${Math.floor(Math.random() * 3) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
  };
}