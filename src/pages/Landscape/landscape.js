import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './landscape.module.css';
import { getLandscapeImages } from '../../utils/api';

const Landscape = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    areaName: '',
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
        limit: 20
      });
      
      const response = await getLandscapeImages({
        ...filters,
        page: pageNum,
        limit: 20
      });
      
      console.log('获取风景图片响应:', response);
      
      if (response.code === 200) {
        const newImages = response.data.images || [];
        
        if (resetList) {
          setImages(newImages);
        } else {
          setImages(prev => [...prev, ...newImages]);
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
    setImages([]);
    setHasMore(true);
  };

  // 初始加载
  useEffect(() => {
    fetchLandscapeImages(1, true);
  }, [filters]);

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

  return (
    <div className={styles.landscapeContainer}>
      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label htmlFor="area-select">狩猎区域:</label>
          <select 
            id="area-select"
            value={filters.areaName} 
            onChange={(e) => handleFilterChange({ areaName: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="">全部区域</option>
            <option value="阿拉斯加">阿拉斯加</option>
            <option value="非洲草原">非洲草原</option>
            <option value="欧洲森林">欧洲森林</option>
            <option value="北美森林">北美森林</option>
            <option value="亚洲高原">亚洲高原</option>
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
            key={image.id}
            ref={index === images.length - 1 ? lastImageElementRef : null}
            className={styles.waterfallItem}
          >
            <div className={styles.imageWrapper}>
              <img 
                src={`data:${image.imageType};base64,${image.imageData}`}
                alt={image.description || '风景图片'}
                className={styles.landscapeImage}
                loading="lazy"
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