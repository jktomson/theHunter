import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './trophy.module.css';
import { getTrophyImages } from '../../utils/api';

const Trophy = ({ selectedAnimal, selectedArea }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [timestamp, setTimestamp] = useState(null); // 查询时间戳
  const [filters, setFilters] = useState({
    animalName: selectedAnimal || '',
    areaName: selectedArea?.area || '',
    rating: null,
    sortBy: 'uploadTime',
    sortOrder: 'desc'
  });

  const observer = useRef();

  // 获取战利品图片
  const fetchTrophyImages = async (pageNum = 1, resetList = false) => {
    setLoading(true);
    setError(null);

    try {
      console.log('正在获取战利品图片，参数:', {
        ...filters,
        page: pageNum,
        timestamp: timestamp,
        limit: 12
      });
      
      const response = await getTrophyImages({
        ...filters,
        page: pageNum,
        timestamp: timestamp, // 传递时间戳保证分页一致性
        limit: 12
      });
      
      console.log('获取战利品图片响应:', response);
      
      if (response.code === 200) {
        const newImages = response.data.images || [];
        
        if (resetList) {
          setImages(newImages);
          // 保存查询时间戳，后续分页使用
          setTimestamp(response.data.pagination.timestamp);
          console.log('重置战利品列表，新列表长度:', newImages.length);
        } else {
          setImages(prev => {
            const combined = [...prev, ...newImages];
            console.log('追加战利品，之前:', prev.length, '新增:', newImages.length, '总计:', combined.length);
            // 添加索引标记来验证顺序
            return combined.map((img, index) => ({ ...img, loadOrder: index }));
          });
        }
        
        setHasMore(response.data.pagination.hasNextPage);
        setPage(pageNum);
      } else {
        console.error('API返回错误:', response);
        setError(response.message || '获取图片失败');
      }
    } catch (error) {
      console.error('获取战利品图片失败:', error);
      setError(`网络请求失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 加载更多图片
  const loadMoreImages = () => {
    if (!loading && hasMore) {
      fetchTrophyImages(page + 1, false);
    }
  };

  const lastImageElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreImages();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // 处理筛选条件变化
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
    setTimestamp(null); // 重置时间戳
    setImages([]);
    setHasMore(true);
  };

  // 初始加载
  useEffect(() => {
    fetchTrophyImages(1, true);
  }, [filters]);

  // 监听props变化，更新filters
  useEffect(() => {
    if (selectedAnimal || selectedArea) {
      setFilters(prev => ({
        ...prev,
        animalName: selectedAnimal || '',
        areaName: selectedArea?.area || ''
      }));
      setPage(1);
      setTimestamp(null);
      setImages([]);
      setHasMore(true);
    }
  }, [selectedAnimal, selectedArea]);

  // 验证和修复base64数据
  const validateBase64Image = (imageData, imageType) => {
    if (!imageData) return null;
    
    // 移除可能的前缀
    let cleanData = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // 验证base64格式
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanData)) {
      console.error('无效的base64数据');
      return null;
    }
    
    return `data:${imageType || 'image/jpeg'};base64,${cleanData}`;
  };

  // 格式化上传时间
  const formatUploadTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取评级颜色
  const getRatingColor = (rating) => {
    const colors = {
      0: '#6c757d',    // 无评级 - 灰色
      1: '#cd7f32',    // 青铜 - 青铜色
      2: '#c0c0c0',    // 白银 - 银色
      3: '#ffd700',    // 黄金 - 金色
      4: '#00bfff',    // 钻石 - 钻石蓝
      5: '#ff6b35'     // 奇珍异兽 - 橙红色
    };
    return colors[rating] || '#6c757d';
  };

  return (
    <div className={styles.trophyContainer}>
      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label htmlFor="rating-select">奖杯评级:</label>
          <select 
            id="rating-select"
            value={filters.rating !== null ? filters.rating.toString() : ''} 
            onChange={(e) => {
              const value = e.target.value;
              const rating = value === '' ? null : parseInt(value);
              handleFilterChange({ rating });
            }}
            className={styles.filterSelect}
          >
            <option value="">全部评级</option>
            <option value="0">无评级</option>
            <option value="1">青铜</option>
            <option value="2">白银</option>
            <option value="3">黄金</option>
            <option value="4">钻石</option>
            <option value="5">奇珍异兽</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sort-select">排序方式:</label>
          <select 
            id="sort-select"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange({ sortBy, sortOrder });
            }}
            className={styles.filterSelect}
          >
            <option value="uploadTime-desc">最新上传</option>
            <option value="uploadTime-asc">最早上传</option>
            <option value="rating-desc">评级最高</option>
            <option value="viewCount-desc">浏览量高</option>
            <option value="likeCount-desc">点赞最多</option>
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => fetchTrophyImages(1, true)}>重试</button>
        </div>
      )}

      {/* 瀑布流容器 */}
      <div className={styles.waterfallContainer}>
        {images.map((image, index) => (
          <div 
            key={`${image.id}-${image.loadOrder || index}`} // 使用复合key确保唯一性
            ref={index === images.length - 1 ? lastImageElementRef : null}
            className={styles.waterfallItem}
            style={{ order: image.loadOrder || index }} // 确保顺序
          >
            <div className={styles.imageWrapper}>
              <img 
                src={validateBase64Image(image.imageData, image.imageType) || '/placeholder-image.svg'}
                alt={`${image.animalName} - ${image.ratingText}`}
                className={styles.trophyImage}
                loading="lazy"
                onError={(e) => {
                  console.error('图片加载失败:', {
                    id: image.id,
                    loadOrder: image.loadOrder,
                    imageType: image.imageType,
                    imageDataLength: image.imageData?.length,
                    imageDataStart: image.imageData?.substring(0, 50)
                  });
                  e.target.src = '/placeholder-image.svg';
                }}
              />
              <div className={styles.imageOverlay}>
                <div className={styles.ratingBadge} style={{ backgroundColor: getRatingColor(image.rating) }}>
                  {image.ratingText}
                </div>
                <div className={styles.imageStats}>
                  <span className={styles.viewCount}>👁 {image.viewCount}</span>
                  <span className={styles.likeCount}>❤ {image.likeCount}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.imageInfo}>
              <div className={styles.imageHeader}>
                <h3 className={styles.imageTitle}>
                  {image.animalName}
                </h3>
                <span className={styles.fileSize}>
                  {formatFileSize(image.fileSize)}
                </span>
              </div>
              
              <div className={styles.locationInfo}>
                <span className={styles.areaName}>{image.areaName}</span>
                <span 
                  className={styles.ratingText}
                  style={{ color: getRatingColor(image.rating) }}
                >
                  ⭐ {image.ratingText}
                </span>
              </div>
              
              {image.description && (
                <p className={styles.imageDescription}>
                  {image.description}
                </p>
              )}
              
              <div className={styles.imageFooter}>
                <div className={styles.uploaderInfo}>
                  <span className={styles.uploaderName}>
                    {image.uploaderNickname}
                  </span>
                  <span className={styles.uploadTime}>
                    {formatUploadTime(image.uploadTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>正在加载更多战利品...</p>
        </div>
      )}

      {/* 没有更多数据 */}
      {!hasMore && images.length > 0 && (
        <div className={styles.noMoreData}>
          <p>已加载全部战利品</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && images.length === 0 && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏆</div>
          <h3>暂无战利品</h3>
          <p>还没有上传战利品图片，快去狩猎获得你的第一个战利品吧！</p>
        </div>
      )}
    </div>
  );
};

export default Trophy;