import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './landscape.module.css';
import { getLandscapeImages } from '../../utils/api';

const Landscape = ({ selectedArea }) => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [timestamp, setTimestamp] = useState(null); // 查询时间戳
  const [filters, setFilters] = useState({
    areaName: selectedArea?.area || '',
    sortBy: 'uploadTime',
    sortOrder: 'desc'
  });

  const observer = useRef();
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

  // 获取风景图片
  const fetchLandscapeImages = async (pageNum = 1, resetList = false) => {
    setLoading(true);
    setError(null);

    try {
      console.log('正在获取风景图片，参数:', {
        ...filters,
        page: pageNum,
        timestamp: timestamp,
        limit: 12
      });
      
      const response = await getLandscapeImages({
        ...filters,
        page: pageNum,
        timestamp: timestamp, // 传递时间戳保证分页一致性
        limit: 12
      });
      
      console.log('获取风景图片响应:', response);
      
      if (response.code === 200) {
        const newImages = response.data.images || [];
        
        if (resetList) {
          setImages(newImages);
          // 保存查询时间戳，后续分页使用
          setTimestamp(response.data.pagination.timestamp);
          console.log('重置图片列表，新列表长度:', newImages.length);
        } else {
          setImages(prev => {
            const combined = [...prev, ...newImages];
            console.log('追加图片，之前:', prev.length, '新增:', newImages.length, '总计:', combined.length);
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
      console.error('获取风景图片失败:', error);
      setError(`网络请求失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 加载更多图片
  const loadMoreImages = () => {
    if (!loading && hasMore) {
      fetchLandscapeImages(page + 1, false);
    }
  };

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
    fetchLandscapeImages(1, true);
  }, [filters]);

  // 监听props变化，更新filters
  useEffect(() => {
    if (selectedArea) {
      setFilters(prev => ({
        ...prev,
        areaName: selectedArea.area || ''
      }));
      setPage(1);
      setTimestamp(null);
      setImages([]);
      setHasMore(true);
    }
  }, [selectedArea]);

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

  // 处理图片点击事件
  const handleImageClick = (imageId) => {
    navigate(`/comment/${imageId}`);
  };

  return (
    <div className={styles.landscapeContainer}>
      {/* 筛选栏 */}
      <div className={styles.filterBar}>
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
            <option value="viewCount-desc">浏览量高</option>
            <option value="likeCount-desc">点赞最多</option>
          </select>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => fetchLandscapeImages(1, true)}>重试</button>
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
            <div 
              className={styles.imageWrapper}
              onClick={() => handleImageClick(image.id)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={validateBase64Image(image.imageData, image.imageType) || '/placeholder-image.svg'}
                alt={image.description || '风景图片'}
                className={styles.landscapeImage}
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
                <div className={styles.imageStats}>
                  <span className={styles.viewCount}>👁 {image.viewCount}</span>
                  <span className={styles.likeCount}>❤ {image.likeCount}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.imageInfo}>
              <div className={styles.imageHeader}>
                <h3 className={styles.imageTitle}>
                  {image.areaName || '未知区域'}
                </h3>
                <span className={styles.fileSize}>
                  {formatFileSize(image.fileSize)}
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
                    📸 {image.uploaderNickname}
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
          <p>正在加载更多风景图片...</p>
        </div>
      )}

      {/* 没有更多数据 */}
      {!hasMore && images.length > 0 && (
        <div className={styles.noMoreData}>
          <p>已加载全部风景图片</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && images.length === 0 && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏞️</div>
          <h3>暂无风景图片</h3>
          <p>还没有上传风景图片，快去分享你的精彩瞬间吧！</p>
        </div>
      )}
    </div>
  );
};

export default Landscape;