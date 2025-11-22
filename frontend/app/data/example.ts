// Example usage of mock data
// This file demonstrates how to use the mock data in your components

import {
  getStormData,
  getActiveStorms,
  getRescuePoints,
  getDamagePoints,
  getStormStatistics,
  getStormsWithLatestPosition
} from './mockDataHelpers';

// Example 1: Get all data for a specific storm
export const exampleGetStormData = () => {
  const stormData = getStormData(1); // Get data for storm ID 1 (Yagi)

  if (stormData) {
    console.log('Storm info:', stormData.storm);
    console.log('Number of tracks:', stormData.tracks.length);
    console.log('Number of news sources:', stormData.newsSources.length);
    console.log('Number of social posts:', stormData.socialPosts.length);
    console.log('Number of rescue requests:', stormData.rescueRequests.length);
    console.log('Number of damage assessments:', stormData.damageAssessments.length);
  }

  return stormData;
};

// Example 2: Get active storms for the dashboard
export const exampleGetActiveStorms = () => {
  const activeStorms = getActiveStorms();
  console.log('Active storms:', activeStorms);

  // Get latest positions for active storms
  const stormsWithPositions = getStormsWithLatestPosition().filter(storm =>
    storm.end_date === null
  );

  return { activeStorms, stormsWithPositions };
};

// Example 3: Get data for map markers
export const exampleGetMapData = () => {
  const rescuePoints = getRescuePoints();
  const damagePoints = getDamagePoints();

  console.log('Rescue points:', rescuePoints.length);
  console.log('Damage points:', damagePoints.length);

  return { rescuePoints, damagePoints };
};

// Example 4: Get storm statistics for info panel
export const exampleGetStormStatistics = () => {
  const statistics = getStormStatistics(1); // Statistics for storm ID 1

  if (statistics) {
    console.log('Storm statistics:', statistics.statistics);
  }

  return statistics;
};

// Example 5: Get all storms with their latest positions (for overview map)
export const exampleGetAllStormsOverview = () => {
  const stormsOverview = getStormsWithLatestPosition();

  // Separate active and inactive storms
  const activeStorms = stormsOverview.filter(storm => storm.end_date === null);
  const inactiveStorms = stormsOverview.filter(storm => storm.end_date !== null);

  console.log('Active storms:', activeStorms.length);
  console.log('Inactive storms:', inactiveStorms.length);

  return { activeStorms, inactiveStorms, allStorms: stormsOverview };
};

// Example 6: Get recent activity (social posts and rescue requests)
export const exampleGetRecentActivity = () => {
  const recentStorms = getStormsWithLatestPosition()
    .filter(storm => {
      const startDate = new Date(storm.start_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return startDate >= thirtyDaysAgo;
    });

  const recentActivity = recentStorms.map(storm => ({
    storm: storm,
    statistics: getStormStatistics(storm.storm_id)?.statistics
  }));

  console.log('Recent storm activity:', recentActivity);

  return recentActivity;
};

// Example usage in React component (pseudo-code)
/*
import React from 'react';
import { getStormData, getRescuePoints } from '@/app/data';

const StormMap: React.FC = () => {
  const [selectedStorm, setSelectedStorm] = useState<number | null>(null);
  const [rescuePoints, setRescuePoints] = useState([]);

  useEffect(() => {
    // Load rescue points for map
    const points = getRescuePoints();
    setRescuePoints(points);
  }, []);

  const handleStormSelect = (stormId: number) => {
    setSelectedStorm(stormId);
    const stormData = getStormData(stormId);
    // Update map with storm tracks, etc.
  };

  return (
    <div>
      <Map
        rescuePoints={rescuePoints}
        selectedStorm={selectedStorm}
        onStormSelect={handleStormSelect}
      />
    </div>
  );
};
*/
