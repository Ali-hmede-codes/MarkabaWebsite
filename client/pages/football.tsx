import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Clock, Calendar, Trophy } from 'lucide-react';

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

const FootballPage: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFootballData();
  }, []);

  const fetchFootballData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/football/leagues-with-matches');
      if (!response.ok) {
        throw new Error('Failed to fetch football data');
      }
      const data = await response.json();
      setLeagues(data.leagues || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatMatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMatchStatus = (match: Match) => {
    const status = match.fixture.status.short;
    if (status === 'FT') return 'انتهت';
    if (status === 'LIVE') return 'مباشر';
    if (status === 'HT') return 'استراحة';
    if (status === 'NS') return 'لم تبدأ';
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'FT') return 'text-gray-600';
    if (status === 'LIVE') return 'text-red-500 animate-pulse';
    if (status === 'HT') return 'text-yellow-500';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>كرة القدم -  مـركـبـا - الـمـنـصـة الاخـبـاريـة</title>
          <meta name="description" content="متابعة أحدث مباريات كرة القدم والدوريات العالمية" />
        </Head>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل بيانات كرة القدم...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>كرة القدم - مـركـبـا - الـمـنـصـة الاخـبـاريـة</title>
        </Head>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Trophy className="h-12 w-12 mx-auto mb-2" />
              </div>
              <p className="text-red-600 mb-4">خطأ في تحميل بيانات كرة القدم</p>
              <button
                onClick={fetchFootballData}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>كرة القدم - أخبار مركبا</title>
        <meta name="description" content="متابعة أحدث مباريات كرة القدم والدوريات العالمية" />
        <meta name="keywords" content="كرة القدم, مباريات, دوريات, نتائج" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2 flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8" />
            كرة القدم
          </h1>
          <p className="text-gray-600">متابعة أحدث مباريات الدوريات العالمية</p>
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
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full p-2 flex items-center justify-center">
                      <img
                        src={league.logo}
                        alt={league.name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{league.name}</h2>
                      <p className="text-blue-100">{league.country} • موسم {league.season}</p>
                    </div>
                  </div>
                </div>

                {/* Matches */}
                <div className="p-6">
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
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            {/* Home Team */}
                            <div className="flex items-center gap-3 flex-1">
                              <img
                                src={match.teams.home.logo}
                                alt={match.teams.home.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.svg';
                                }}
                              />
                              <span className="font-medium text-gray-800 text-sm">
                                {match.teams.home.name}
                              </span>
                            </div>

                            {/* Match Info */}
                            <div className="flex flex-col items-center gap-1 px-4">
                              {match.goals.home !== null && match.goals.away !== null ? (
                                <div className="text-lg font-bold text-blue-700">
                                  {match.goals.home} - {match.goals.away}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm font-medium">
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
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <span className="font-medium text-gray-800 text-sm">
                                {match.teams.away.name}
                              </span>
                              <img
                                src={match.teams.away.logo}
                                alt={match.teams.away.name}
                                className="w-8 h-8 object-contain"
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

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchFootballData}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            تحديث البيانات
          </button>
        </div>
      </div>
    </div>
  );
};

export default FootballPage;