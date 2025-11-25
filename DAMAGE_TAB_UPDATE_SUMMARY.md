# Damage Tab API Integration - Update Summary

## Overview

Updated the DamageTab component to fetch and display real damage assessment data from the backend API at `http://118.70.181.146:58888` instead of using mock data.

## Changes Made

### 1. Created API Service (`frontend/app/services/damageApi.ts`)

- **Purpose**: Centralized API calls for damage assessment data
- **Interfaces Added**:

  - `DamageCasualties`: deaths, missing, injured (all nullable)
  - `DamageProperty`: houses_damaged, houses_flooded, boats_damaged, description
  - `DamageInfrastructure`: roads_damaged, schools_damaged, hospitals_damaged, description
  - `DamageAgriculture`: crop_area_damaged_ha, livestock_lost, aquaculture_damaged_ha, description
  - `DamageSource`: name and optional url for news sources
  - `DamageDetail`: casualties, property, infrastructure, agriculture, total_economic_loss_vnd, summary, sources[]
  - `DamageAssessment`: id, storm_id, location_name, detail (nested JSON), time, created_at, updated_at

- **Functions**:
  - `getDamageByStorm(stormId, skip, limit)`: Get all damage assessments for a storm
  - `getLatestDamageByStorm(stormId)`: Get most recent assessment for a storm
  - `getAllDamage(skip, limit)`: Get all damage assessments

### 2. Updated DamageTab Component (`frontend/app/components/damage/DamageTab.tsx`)

#### Data Fetching

- Added `useEffect` hook to fetch damage data when `stormId` changes
- Fetches latest damage for summary card
- Fetches all damages for list view
- Added loading state with spinner animation
- Proper error handling with console logging

#### Helper Functions Updated

- **`formatNumber(num)`**: Added null-safe formatting with ?? operator
- **`formatDate(dateString)`**: Returns formatted date string
- **`getSeverityColor(deaths, injured, missing)`**: Updated to accept 3 parameters and use null coalescing

#### Calculated Totals (from latest damage)

- `totalDeaths`: Sum from casualties.deaths
- `totalMissing`: Sum from casualties.missing
- `totalInjured`: Sum from casualties.injured
- `totalEconomicLoss`: From detail.total_economic_loss_vnd

#### UI Structure

##### Summary Card (Top Section)

Displays aggregated data from the latest damage assessment:

- **Casualties Grid**: 3 cards showing deaths (red), missing (yellow), injured (orange)
- **Economic Loss**: Purple card showing total in billion VND
- **Summary Text**: Blue card with italic summary text

##### Damage Assessment List

Each card shows:

**Collapsed View**:

- Location name or fallback to "Thiệt hại #[id]"
- Created date
- Quick stats for deaths, missing, injured (only shown if > 0)
- Color-coded border based on severity

**Expanded View** (click to expand):

1. **Property Damage Section** (🏠):

   - Grid showing houses damaged, houses flooded, boats damaged
   - Description text if available

2. **Infrastructure Section** (🏗️):

   - Description of infrastructure damage
   - Grid showing roads, schools, hospitals damaged (if available)

3. **Agriculture Section** (🌾):

   - Grid showing crop area (ha), livestock lost, aquaculture (ha)
   - Description text if available

4. **Economic Loss** (💰):

   - Purple card with total in billion VND

5. **Sources** (📰):
   - Collapsible details showing news source names
   - Links to source URLs (if available)

#### Null Safety

All nullable fields use the nullish coalescing operator (`??`) to handle null/undefined values:

```typescript
(casualties.deaths ?? 0) >
  0(property.houses_damaged ?? 0) >
  0(agriculture.crop_area_damaged_ha ?? 0) >
  0;
```

### 3. Data Structure Mapping

**Old Mock Data Structure** → **New API Structure**:

- `damage.total_fatalities` → `damage.detail.casualties.deaths`
- `damage.total_injured` → `damage.detail.casualties.injured`
- `damage.total_facilities` → Multiple fields (roads_damaged, schools_damaged, hospitals_damaged)
- `damage.lat, damage.lon` → Removed (not in API response)
- `damage.news_id` → `damage.detail.sources[]` array
- `damage.description` → Split into property.description, infrastructure.description, agriculture.description

## API Endpoint Used

- **Base URL**: `http://118.70.181.146:58888`
- **Endpoint**: `/api/v1/damage/storm/{stormId}`
- **Latest Endpoint**: `/api/v1/damage/storm/{stormId}/latest`

## Testing Checklist

- [ ] Component loads without errors
- [ ] Loading spinner appears while fetching
- [ ] Summary card displays with correct totals
- [ ] Damage list shows all assessments
- [ ] Click to expand/collapse works
- [ ] All sections display correctly (casualties, property, infrastructure, agriculture)
- [ ] Economic loss shows in billion VND
- [ ] Sources list expands and shows news sources
- [ ] Handles empty data gracefully
- [ ] Mobile responsive layout works
- [ ] Color coding reflects severity correctly

## Color Severity Levels

Based on total casualties (deaths + injured + missing):

- **Critical** (Red): casualties >= 10
- **High** (Orange): casualties >= 5
- **Medium** (Yellow): casualties >= 1
- **Low** (Green): casualties < 1

## Next Steps

1. Test with real storm data from the backend
2. Verify all damage assessments display correctly
3. Add click handler to show location on map
4. Add "View on Map" and "Detailed Report" button functionality
5. Consider adding filters (by date, severity, location)
6. Add pagination if there are many damage assessments

## Files Modified

1. `frontend/app/services/damageApi.ts` - Created
2. `frontend/app/components/damage/DamageTab.tsx` - Refactored
3. `backend/src/core/extract_damage_assesments.py` - Previously updated for data extraction

---

_Updated: 2024_
_Backend API: 118.70.181.146:58888_
