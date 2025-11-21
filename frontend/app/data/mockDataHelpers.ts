import {
  mockStorms,
  mockStormTracks,
  mockNewsSources,
  mockSocialPosts,
  mockRescueRequests,
  mockDamageAssessments,
  type Storm,
  type StormTrack,
  type NewsSource,
  type SocialPost,
  type RescueRequest,
  type DamageAssessment
} from './mockData';

// Helper functions to get data by storm_id
export const getStormById = (stormId: number): Storm | undefined => {
  return mockStorms.find(storm => storm.storm_id === stormId);
};

export const getStormTracks = (stormId: number): StormTrack[] => {
  return mockStormTracks.filter(track => track.storm_id === stormId);
};

export const getNewsSources = (stormId: number): NewsSource[] => {
  return mockNewsSources.filter(news => news.storm_id === stormId);
};

export const getSocialPosts = (stormId: number): SocialPost[] => {
  return mockSocialPosts.filter(post => post.storm_id === stormId);
};

export const getRescueRequests = (stormId: number): RescueRequest[] => {
  return mockRescueRequests.filter(request => request.storm_id === stormId);
};

export const getDamageAssessments = (stormId: number): DamageAssessment[] => {
  return mockDamageAssessments.filter(assessment => assessment.storm_id === stormId);
};

// Get all data for a specific storm
export const getStormData = (stormId: number) => {
  const storm = getStormById(stormId);
  if (!storm) return null;

  return {
    storm,
    tracks: getStormTracks(stormId),
    newsSources: getNewsSources(stormId),
    socialPosts: getSocialPosts(stormId),
    rescueRequests: getRescueRequests(stormId),
    damageAssessments: getDamageAssessments(stormId)
  };
};

// Get active storms (storms without end_date)
export const getActiveStorms = (): Storm[] => {
  return mockStorms.filter(storm => storm.end_date === null);
};

// Get recent storms (last 30 days)
export const getRecentStorms = (): Storm[] => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return mockStorms.filter(storm => {
    const startDate = new Date(storm.start_date);
    return startDate >= thirtyDaysAgo;
  });
};

// Get all verified rescue requests
export const getVerifiedRescueRequests = (): RescueRequest[] => {
  return mockRescueRequests.filter(request => request.verified);
};

// Get all valid social posts
export const getValidSocialPosts = (): SocialPost[] => {
  return mockSocialPosts.filter(post => post.is_valid);
};

// Get storm statistics
export const getStormStatistics = (stormId: number) => {
  const storm = getStormById(stormId);
  if (!storm) return null;

  const tracks = getStormTracks(stormId);
  const newsSources = getNewsSources(stormId);
  const socialPosts = getSocialPosts(stormId);
  const rescueRequests = getRescueRequests(stormId);
  const damageAssessments = getDamageAssessments(stormId);

  const totalFatalities = damageAssessments.reduce((sum, assessment) => sum + assessment.total_fatalities, 0);
  const totalInjured = damageAssessments.reduce((sum, assessment) => sum + assessment.total_injured, 0);
  const totalFacilities = damageAssessments.reduce((sum, assessment) => sum + assessment.total_facilities, 0);

  const maxWindSpeed = Math.max(...tracks.map(track => track.wind_speed));
  const maxCategory = Math.max(...tracks.map(track => track.category));

  return {
    storm,
    statistics: {
      totalFatalities,
      totalInjured,
      totalFacilities,
      maxWindSpeed,
      maxCategory,
      totalNewsSources: newsSources.length,
      totalSocialPosts: socialPosts.length,
      totalRescueRequests: rescueRequests.length,
      verifiedRescueRequests: rescueRequests.filter(r => r.verified).length
    }
  };
};

// Get all storms with their latest position
export const getStormsWithLatestPosition = () => {
  return mockStorms.map(storm => {
    const tracks = getStormTracks(storm.storm_id);
    const latestTrack = tracks.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    return {
      ...storm,
      latestPosition: latestTrack ? {
        lat: latestTrack.lat,
        lon: latestTrack.lon,
        category: latestTrack.category,
        wind_speed: latestTrack.wind_speed,
        timestamp: latestTrack.timestamp
      } : null
    };
  });
};

// Get all rescue points (from verified rescue requests)
export const getRescuePoints = () => {
  return mockRescueRequests
    .filter(request => request.verified)
    .map(request => ({
      id: request.request_id,
      lat: request.lat,
      lon: request.lon,
      severity: request.severity,
      storm_id: request.storm_id,
      phone: request.phone,
      created_at: request.created_at
    }));
};

// Get all damage points (from damage assessments)
export const getDamagePoints = () => {
  return mockDamageAssessments.map(assessment => ({
    id: assessment.id,
    lat: assessment.lat,
    lon: assessment.lon,
    storm_id: assessment.storm_id,
    fatalities: assessment.total_fatalities,
    injured: assessment.total_injured,
    facilities: assessment.total_facilities,
    updated_at: assessment.updated_at
  }));
};

// Export all mock data for direct access
export {
  mockStorms,
  mockStormTracks,
  mockNewsSources,
  mockSocialPosts,
  mockRescueRequests,
  mockDamageAssessments,
  type Storm,
  type StormTrack,
  type NewsSource,
  type SocialPost,
  type RescueRequest,
  type DamageAssessment
};
