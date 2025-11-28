/**
 * Test script để kiểm tra TIFF service với real-time GMT+7
 * Run: node test-tiff-service.js (sau khi compile TypeScript)
 */

import {
  initializeTimestamps,
  getAvailableTimestamps,
  getCurrentTimestamp,
  getCurrentTimeGMT7,
  loadWindDataForTimestamp,
  refreshTimestamps,
  ALL_AVAILABLE_TIMESTAMPS
} from './tiffService';

async function testTiffService() {
  console.log('🧪 Testing TIFF Service with GMT+7 Real-time');
  console.log('='.repeat(60));
  
  try {
    // 1. Test getCurrentTimeGMT7
    console.log('\n1️⃣ Testing getCurrentTimeGMT7()...');
    const currentTimeGMT7 = getCurrentTimeGMT7();
    console.log(`   Current time (GMT+7): ${currentTimeGMT7.toISOString()}`);
    console.log(`   Formatted: ${currentTimeGMT7.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })}`);
    
    // 2. Test initializeTimestamps
    console.log('\n2️⃣ Testing initializeTimestamps()...');
    const allTimestamps = await initializeTimestamps();
    console.log(`   Found ${allTimestamps.length} timestamps`);
    if (allTimestamps.length > 0) {
      console.log(`   First: ${allTimestamps[0].timestamp}`);
      console.log(`   Last: ${allTimestamps[allTimestamps.length - 1].timestamp}`);
    }
    
    // 3. Test getAvailableTimestamps (5 ngày gần nhất)
    console.log('\n3️⃣ Testing getAvailableTimestamps()...');
    const availableTimestamps = await getAvailableTimestamps();
    console.log(`   Display timestamps: ${availableTimestamps.length}`);
    if (availableTimestamps.length > 0) {
      console.log(`   First: ${availableTimestamps[0].timestamp}`);
      console.log(`   Last: ${availableTimestamps[availableTimestamps.length - 1].timestamp}`);
    }
    
    // 4. Test getCurrentTimestamp
    console.log('\n4️⃣ Testing getCurrentTimestamp()...');
    const currentTimestamp = await getCurrentTimestamp();
    console.log(`   Current timestamp: ${currentTimestamp}`);
    
    // 5. Test loadWindDataForTimestamp
    console.log('\n5️⃣ Testing loadWindDataForTimestamp()...');
    console.log(`   Loading wind data for: ${currentTimestamp}`);
    const windData = await loadWindDataForTimestamp(currentTimestamp);
    console.log(`   Wind data loaded successfully!`);
    console.log(`   Dimensions: ${windData.width}x${windData.height}`);
    console.log(`   BBox: [${windData.bbox.join(', ')}]`);
    console.log(`   Data size: ${(windData.u.length * 4 / 1024 / 1024).toFixed(2)} MB`);
    
    // Calculate some statistics
    let minSpeed = Infinity;
    let maxSpeed = -Infinity;
    let avgSpeed = 0;
    
    for (let i = 0; i < windData.speed.length; i++) {
      const speed = windData.speed[i];
      if (speed < minSpeed) minSpeed = speed;
      if (speed > maxSpeed) maxSpeed = speed;
      avgSpeed += speed;
    }
    avgSpeed /= windData.speed.length;
    
    console.log(`   Wind speed range: ${minSpeed.toFixed(2)} - ${maxSpeed.toFixed(2)} m/s`);
    console.log(`   Average speed: ${avgSpeed.toFixed(2)} m/s`);
    
    // 6. Test cache
    console.log('\n6️⃣ Testing cache...');
    console.log('   Calling getAvailableTimestamps() again (should use cache)...');
    const cachedTimestamps = await getAvailableTimestamps();
    console.log(`   Cache working: ${cachedTimestamps.length === availableTimestamps.length ? '✅' : '❌'}`);
    
    // 7. Test refresh
    console.log('\n7️⃣ Testing refreshTimestamps()...');
    console.log('   Clearing cache and rescanning...');
    const refreshedTimestamps = await refreshTimestamps();
    console.log(`   Refreshed: ${refreshedTimestamps.length} timestamps`);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testTiffService().catch(console.error);
