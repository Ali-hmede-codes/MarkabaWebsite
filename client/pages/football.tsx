import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiClock as Clock, FiCalendar as Calendar, FiAward as Trophy } from 'react-icons/fi';
import Layout from '../components/Layout/Layout';

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Match {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
    };
    venue: {
      name: string;
    };
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  season: number;
  matches: Match[];
}

// Transform stored matches to leagues format
const transformStoredMatchesToLeagues = (matches: any[]): League[] => {
  // Only include these specific important leagues
  const importantLeagueIds = [39, 140, 135, 78, 61, 2, 3]; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League
  
  const leaguesMap = new Map<number, League>();
  
  matches.forEach((match) => {
    const leagueId = match.league.id;
    
    // Only process matches from important leagues
    if (!importantLeagueIds.includes(leagueId)) {
      return;
    }
    
    if (!leaguesMap.has(leagueId)) {
      leaguesMap.set(leagueId, {
        id: leagueId,
        name: match.league.name,
        country: match.league.country,
        logo: match.league.logo,
        season: match.league.season,
        matches: []
      });
    }
    
    leaguesMap.get(leagueId)!.matches.push(match);
  });
  
  return Array.from(leaguesMap.values());
};

const FootballPage: React.FC = () => {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFootballData();
  }, []);

  const fetchFootballData = async () => {
    try {
      setLoading(true);
      const apiUrl = '/api/v2/football/matches/stored';
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch football data');
      }
      const data = await response.json();
      
      // Transform stored matches data to leagues format
      const transformedLeagues = transformStoredMatchesToLeagues(data.data || []);
      setLeagues(transformedLeagues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMatchStatus = (match: Match) => {
    const status = match.fixture.status.short;
    
    // If match has finished and has goals, show the result
    if (status === 'FT' && match.goals.home !== null && match.goals.away !== null) {
      return `النتيجة: ${match.goals.home} - ${match.goals.away}`;
    }
    
    if (status === 'FT') return 'انتهت';
    if (status === 'LIVE') return 'مباشر';
    if (status === 'HT') return 'استراحة';
    
    // Only show "لم تبدأ" if match hasn't started AND has no goals
    if (status === 'NS' && (match.goals.home === null || match.goals.away === null)) {
      return 'لم تبدأ';
    }
    
    // If match has goals but status is NS, show the result
    if (match.goals.home !== null && match.goals.away !== null) {
      return `النتيجة: ${match.goals.home} - ${match.goals.away}`;
    }
    
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'انتهت' || status.startsWith('النتيجة:')) return 'text-green-600';
    if (status === 'مباشر') return 'text-red-500 animate-pulse';
    if (status === 'استراحة') return 'text-yellow-500';
    if (status === 'لم تبدأ') return 'text-blue-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Layout 
        title="كرة القدم - "
        description="متابعة أحدث مباريات كرة القدم والدوريات العالمية"
        keywords="كرة القدم, مباريات, دوريات, نتائج"
      >
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل بيانات كرة القدم...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout 
        title="كرة القدم - مـركـبـا - الـمـنـصـة الاخـبـاريـة"
        description="متابعة أحدث مباريات كرة القدم والدوريات العالمية"
        keywords="كرة القدم, مباريات, دوريات, نتائج"
      >
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Trophy className="h-12 w-12 mx-auto mb-2" />
              </div>
              <p className="text-red-600 mb-4">خطأ في تحميل بيانات كرة القدم</p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                العودة للقائمة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="كرة القدم - مـركـبـا - الـمـنـصـة الاخـبـاريـة"
      description="متابعة أحدث مباريات كرة القدم والدوريات العالمية"
      keywords="كرة القدم, مباريات, دوريات, نتائج"
      className="bg-gray-50"
    >

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2 flex items-center justify-center gap-2 sm:gap-3">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8" />
            كرة القدم
          </h1>
          <p className="text-sm sm:text-base text-gray-600">متابعة أحدث مباريات الدوريات العالمية</p>
        </div>

        {/* Leagues and Matches */}
        <div className="space-y-8">
          {leagues.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد مباريات متاحة حالياً</p>
            </div>
          ) : (
            leagues.map((league) => (
              <div key={league.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* League Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full p-1 sm:p-2 flex items-center justify-center flex-shrink-0">
                      <img
                        src={league.logo}
                        alt={league.name}
                        className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold truncate">{league.name}</h2>
                      <p className="text-blue-100 text-sm sm:text-base">{league.country} • موسم {league.season}</p>
                    </div>
                  </div>
                </div>

                {/* Matches */}
                <div className="p-4 sm:p-6">
                  {league.matches.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">لا توجد مباريات في هذا الدوري</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {league.matches.map((match) => (
                        <div
                          key={match.fixture.id}
                          className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            {/* Home Team */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <img
                                src={match.teams.home.logo}
                                alt={match.teams.home.name}
                                className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.svg';
                                }}
                              />
                              <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                                {match.teams.home.name}
                              </span>
                            </div>

                            {/* Match Info */}
                            <div className="flex flex-col items-center gap-1 px-2 sm:px-4 flex-shrink-0">
                              {match.goals.home !== null && match.goals.away !== null ? (
                                <div className="text-base sm:text-lg font-bold text-blue-700">
                                  {match.goals.home} - {match.goals.away}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="text-xs sm:text-sm font-medium">
                                    {formatMatchTime(match.fixture.date)}
                                  </span>
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                {formatMatchDate(match.fixture.date)}
                              </div>
                              <div className={`text-xs font-medium ${getStatusColor(getMatchStatus(match))}`}>
                                {getMatchStatus(match)}
                              </div>
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
                              <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                                {match.teams.away.name}
                              </span>
                              <img
                                src={match.teams.away.logo}
                                alt={match.teams.away.name}
                                className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                          </div>

                          {/* Venue */}
                          {match.fixture.venue?.name && (
                            <div className="mt-2 text-xs text-gray-500 text-center">
                              📍 {match.fixture.venue.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Return to Menu Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            العودة للقائمة الرئيسية
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default FootballPage;