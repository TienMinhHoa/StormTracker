// Mock data cho storm tracks
export interface StormTrackPoint {
  track_id: number;
  storm_id: string;
  timestamp: string;
  lat: number;
  lon: number;
  category: number;
  wind_speed: number;
}

export interface StormTrack {
  storm_id: string;
  name: string;
  points: StormTrackPoint[];
  is_active: boolean;
}

// Mock storm track data
export const mockStormTracks: StormTrack[] = [
  {
    storm_id: "2025174N23146",
    name: "Typhoon Khanun",
    is_active: true,
    points: [
      {
        "track_id": 967,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-22T12:00:00",
        "lat": 23.2,
        "lon": 145.9,
        "category": 1,
        "wind_speed": 29
      },
      {
        "track_id": 968,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-22T15:00:00",
        "lat": 23.5,
        "lon": 145.6,
        "category": 1,
        "wind_speed": 29
      },
      {
        "track_id": 969,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-22T18:00:00",
        "lat": 23.8,
        "lon": 145.3,
        "category": 1,
        "wind_speed": 29
      },
      {
        "track_id": 970,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-22T21:00:00",
        "lat": 24.1,
        "lon": 145,
        "category": 1,
        "wind_speed": 32
      },
      {
        "track_id": 971,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-23T00:00:00",
        "lat": 24.6,
        "lon": 144.7,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 972,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-23T03:00:00",
        "lat": 25.2,
        "lon": 144.3,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 973,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-23T06:00:00",
        "lat": 25.9,
        "lon": 143.9,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 974,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-23T09:00:00",
        "lat": 26.4,
        "lon": 143.5,
        "category": 1,
        "wind_speed": 37
      },
      {
        "track_id": 975,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-23T12:00:00",
        "lat": 27,
        "lon": 143,
        "category": 1,
        "wind_speed": 39
      },
      {
        "track_id": 976,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-23T15:00:00",
        "lat": 27.7,
        "lon": 142.5,
        "category": 1,
        "wind_speed": 37
      },
      {
        "track_id": 977,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-23T18:00:00",
        "lat": 28.4,
        "lon": 141.9,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 978,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-23T21:00:00",
        "lat": 28.9,
        "lon": 141.4,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 979,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-24T00:00:00",
        "lat": 29.3,
        "lon": 141,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 980,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-24T03:00:00",
        "lat": 29.7,
        "lon": 140.7,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 981,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-24T06:00:00",
        "lat": 30,
        "lon": 140.4,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 982,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-24T09:00:00",
        "lat": 30.3,
        "lon": 140.2,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 983,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-24T12:00:00",
        "lat": 30.6,
        "lon": 140.1,
        "category": 1,
        "wind_speed": 35
      },
      {
        "track_id": 984,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-24T15:00:00",
        "lat": 30.9,
        "lon": 139.9,
        "category": 1,
        "wind_speed": 32
      },
      {
        "track_id": 985,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-24T18:00:00",
        "lat": 31.3,
        "lon": 139.8,
        "category": 1,
        "wind_speed": 29
      },
      {
        "track_id": 986,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-24T21:00:00",
        "lat": 31.7,
        "lon": 139.6,
        "category": 1,
        "wind_speed": 29
      },
      {
        "track_id": 987,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-25T00:00:00",
        "lat": 32,
        "lon": 139.5,
        "category": 1,
        "wind_speed": 29
      },
      {
        "track_id": 988,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-25T03:00:00",
        "lat": 32.3,
        "lon": 139.5,
        "category": 1,
        "wind_speed": 27
      },
      {
        "track_id": 989,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-25T06:00:00",
        "lat": 32.7,
        "lon": 139.6,
        "category": 1,
        "wind_speed": 25
      },
      {
        "track_id": 990,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-25T09:00:00",
        "lat": 33.2,
        "lon": 139.7,
        "category": 1,
        "wind_speed": 25
      },
      {
        "track_id": 991,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-25T12:00:00",
        "lat": 33.7,
        "lon": 139.8,
        "category": 1,
        "wind_speed": 25
      },
      {
        "track_id": 992,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-25T15:00:00",
        "lat": 34.1,
        "lon": 140,
        "category": 1,
        "wind_speed": 25
      },
      {
        "track_id": 993,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-25T18:00:00",
        "lat": 34.5,
        "lon": 140.3,
        "category": 1,
        "wind_speed": 25
      },
      {
        "track_id": 994,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-25T21:00:00",
        "lat": 35.1,
        "lon": 140.8,
        "category": 1,
        "wind_speed": 25
      },
      {
        "track_id": 995,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-26T00:00:00",
        "lat": 35.7,
        "lon": 141.4,
        "category": 1,
        "wind_speed": 25
      },
      {
        "track_id": 996,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-26T03:00:00",
        "lat": 36.4,
        "lon": 142.1,
        "category": 1,
        "wind_speed": 25
      },
      {
        "track_id": 997,
        "storm_id": "2025174N23146",
        "timestamp": "2025-06-26T06:00:00",
        "lat": 37.1,
        "lon": 142.9,
        "category": 1,
        "wind_speed": 25
      }
    ]
  }
];
