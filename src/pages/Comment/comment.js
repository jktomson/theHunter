import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../../store/userSlice';
import { getImageComments, addComment } from '../../utils/api';
import styles from './comment.module.css';

const Comment = () => {
    const { imageId } = useParams();
    const navigate = useNavigate();
    const isLoggedIn = useSelector(selectIsAuthenticated);
    const user = useSelector(selectUser);
    
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [imageInfo, setImageInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // 加载图片信息和评论
    useEffect(() => {
        const loadImageAndComments = async () => {
            try {
                setLoading(true);
                const commentsData = await getImageComments(imageId);
                if (commentsData.code === 200) {
                    setComments(commentsData.data.comments || []);
                    setImageInfo(commentsData.data.imageInfo);
                }
            } catch (error) {
                console.error('加载评论失败:', error);
            } finally {
                setLoading(false);
            }
        };

        if (imageId) {
            loadImageAndComments();
        }
    }, [imageId]);

    // 提交评论
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            alert('请先登录后再发表评论');
            navigate('/login');
            return;
        }

        if (!newComment.trim()) {
            alert('请输入评论内容');
            return;
        }

        try {
            setSubmitting(true);
            const result = await addComment({
                imageId,
                content: newComment.trim(),
                userId: user.id,
                userNickname: user.nickname
            });

            if (result.code === 200) {
                // 添加新评论到列表
                const comment = {
                    id: result.data.commentId,
                    content: newComment.trim(),
                    userNickname: user.nickname,
                    userId: user.id,
                    createdAt: new Date().toISOString()
                };
                setComments(prev => [comment, ...prev]);
                setNewComment('');
            } else {
                alert('发表评论失败：' + result.message);
            }
        } catch (error) {
            console.error('发表评论失败:', error);
            alert('发表评论失败，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>加载中...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button 
                    className={styles.backButton}
                    onClick={() => navigate(-1)}
                >
                    ← 返回
                </button>
                <h1>图片评论</h1>
            </div>

            {imageInfo && (
                <div className={styles.imageSection}>
                    <img 
                        src={imageInfo.imageUrl} 
                        alt={`${imageInfo.areaName} - ${imageInfo.animalName}`}
                        className={styles.image}
                    />
                    <div className={styles.imageInfo}>
                        <h3>{imageInfo.areaName} - {imageInfo.animalName}</h3>
                        {imageInfo.rating > 0 && (
                            <p>评级: {['', '青铜', '白银', '黄金', '钻石', '奇珍异兽'][imageInfo.rating]}</p>
                        )}
                        <p>上传者: {imageInfo.uploaderNickname}</p>
                    </div>
                </div>
            )}

            <div className={styles.commentsSection}>
                <h2>评论 ({comments.length})</h2>
                
                {/* 评论表单 */}
                {isLoggedIn ? (
                    <form onSubmit={handleSubmitComment} className={styles.commentForm}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="发表你的评论..."
                            className={styles.commentInput}
                            rows={3}
                            disabled={submitting}
                        />
                        <button 
                            type="submit" 
                            className={styles.submitButton}
                            disabled={submitting || !newComment.trim()}
                        >
                            {submitting ? '发表中...' : '发表评论'}
                        </button>
                    </form>
                ) : (
                    <div className={styles.loginPrompt}>
                        <p>请 <button onClick={() => navigate('/login')}>登录</button> 后发表评论</p>
                    </div>
                )}

                {/* 评论列表 */}
                <div className={styles.commentsList}>
                    {comments.length === 0 ? (
                        <div className={styles.noComments}>
                            还没有评论，来发表第一个评论吧！
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className={styles.comment}>
                                <div className={styles.commentHeader}>
                                    <span className={styles.userName}>{comment.userNickname}</span>
                                    <span className={styles.commentTime}>
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className={styles.commentContent}>
                                    {comment.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Comment;
