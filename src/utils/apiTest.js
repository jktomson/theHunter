// API测试文件
import { getLandscapeImages, getTrophyImages } from './api';

// 测试获取风景图片
export const testLandscapeAPI = async () => {
  try {
    console.log('测试风景图片API...');
    const response = await getLandscapeImages({
      areaName: '',
      sortBy: 'uploadTime',
      sortOrder: 'desc',
      page: 1,
      limit: 5
    });
    console.log('风景图片API响应:', response);
    return response;
  } catch (error) {
    console.error('风景图片API测试失败:', error);
    throw error;
  }
};

// 测试获取奖杯图片
export const testTrophyAPI = async () => {
  try {
    console.log('测试奖杯图片API...');
    const response = await getTrophyImages({
      areaName: '',
      animalName: '',
      rating: null,
      sortBy: 'uploadTime',
      sortOrder: 'desc',
      page: 1,
      limit: 5
    });
    console.log('奖杯图片API响应:', response);
    return response;
  } catch (error) {
    console.error('奖杯图片API测试失败:', error);
    throw error;
  }
};

// 运行所有测试
export const runAllTests = async () => {
  console.log('开始API测试...');
  
  try {
    await testLandscapeAPI();
    console.log('✅ 风景图片API测试通过');
  } catch (error) {
    console.log('❌ 风景图片API测试失败');
  }
  
  try {
    await testTrophyAPI();
    console.log('✅ 奖杯图片API测试通过');
  } catch (error) {
    console.log('❌ 奖杯图片API测试失败');
  }
  
  console.log('API测试完成');
};
