import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, selectUserLoading, selectIsAuthenticated, logout } from '../../store/userSlice';
import styles from './userpage.module.css';

const UserPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // 从Redux获取用户信息
    const user = useSelector(selectUser);
    const loading = useSelector(selectUserLoading);
    const isLoggedIn = useSelector(selectIsAuthenticated);
    
    const [error, setError] = useState(null);

    useEffect(() => {
        // 如果用户未登录，跳转到登录页面
        if (!isLoggedIn || !user) {
            navigate('/login');
        }
    }, [isLoggedIn, user, navigate]);

    const handleLogout = () => {
        if (window.confirm('确定要退出登录吗？')) {
            dispatch(logout());
            navigate('/login');
        }
    };

    const handleEditProfile = () => {
        alert('编辑个人信息功能待实现');
    };

    const getInitials = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    const getJoinDays = (createdAt) => {
        if (!createdAt) return 0;
        const joinDate = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - joinDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.loadingSpinner}></div>
                    加载用户信息中...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <div className={styles.errorMessage}>{error}</div>
                    <button 
                        onClick={() => window.location.reload()} 
                        className={`${styles.actionButton} ${styles.primaryButton}`}
                    >
                        重新加载
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <div className={styles.errorIcon}>👤</div>
                    <div className={styles.errorMessage}>未找到用户信息</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.userPageWrapper}>
                {/* 头部区域 */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.avatarSection}>
                            <div className={styles.avatar}>
                                {getInitials(user.nickname)}
                            </div>
                            <div className={styles.avatarBadge}>
                                {user.profile?.level || 1}
                            </div>
                        </div>
                        
                        <div className={styles.userInfo}>
                            <h1 className={styles.userName}>{user.nickname}</h1>
                            <p className={styles.userEmail}>{user.email}</p>
                            
                            <div className={styles.userStats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>
                                        {user.profile?.level || 1}
                                    </span>
                                    <span className={styles.statLabel}>等级</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>
                                        {user.profile?.experience || 0}
                                    </span>
                                    <span className={styles.statLabel}>经验值</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>
                                        {getJoinDays(user.createdAt)}
                                    </span>
                                    <span className={styles.statLabel}>加入天数</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 主要内容 */}
                <div className={styles.content}>
                    {/* 个人信息卡片 */}
                    <div className={`${styles.card} ${styles.profileInfo}`}>
                        <h2 className={styles.cardTitle}>
                            <span className={styles.cardIcon}>👤</span>
                            个人信息
                        </h2>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>昵称</label>
                                <div className={styles.infoValue}>{user.nickname}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>邮箱</label>
                                <div className={styles.infoValue}>{user.email}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>注册时间</label>
                                <div className={styles.infoValue}>
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <label className={styles.infoLabel}>最后登录</label>
                                <div className={styles.infoValue}>
                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN') : '首次登录'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className={styles.actions}>
                        <button 
                            onClick={handleEditProfile}
                            className={`${styles.actionButton} ${styles.primaryButton}`}
                        >
                            <span>✏️</span>
                            编辑资料
                        </button>
                        <button 
                            onClick={handleLogout}
                            className={`${styles.actionButton} ${styles.secondaryButton}`}
                        >
                            <span>🚪</span>
                            退出登录
                        </button>
                        <button 
                            onClick={() => navigate('/')}
                            className={`${styles.actionButton} ${styles.secondaryButton}`}
                        >
                            返回首页
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserPage;