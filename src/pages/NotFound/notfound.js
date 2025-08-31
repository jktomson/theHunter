import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './notfound.module.css';

const NotFound = () => {
    const navigate = useNavigate();

    // 自动回到首页（可选功能）
    useEffect(() => {
        // 如果需要自动跳转，可以取消注释下面的代码
        // const timer = setTimeout(() => {
        //     navigate('/home');
        // }, 10000); // 10秒后自动跳转
        // return () => clearTimeout(timer);
    }, [navigate]);

    const handleGoHome = () => {
        navigate('/home');
    };

    const handleGoBack = () => {
        window.history.length > 1 ? navigate(-1) : navigate('/home');
    };

    return (
        <div className={styles.container}>
            {/* 背景装饰 */}
            <div className={styles.backgroundDecor}></div>
            
            {/* 浮动装饰元素 */}
            <div className={styles.floatingElements}>
                {[...Array(9)].map((_, index) => (
                    <div key={index} className={styles.floatingElement}></div>
                ))}
            </div>

            <div className={styles.notFoundBox}>
                {/* 404错误代码 */}
                <h1 className={styles.errorCode}>404</h1>
                
                {/* 主标题 */}
                <h2 className={styles.title}>页面走丢了</h2>
                
                {/* 副标题 */}
                <p className={styles.subtitle}>
                    抱歉，您访问的页面不存在或已被移除。<br />
                    让我们帮您找到正确的路径。
                </p>

                {/* 按钮组 */}
                <div className={styles.buttonGroup}>
                    <button 
                        onClick={handleGoHome}
                        className={styles.primaryButton}
                    >
                        <span className={styles.icon}>🏠</span>
                        返回首页
                    </button>
                    
                    <button 
                        onClick={handleGoBack}
                        className={styles.secondaryButton}
                    >
                        <span className={styles.icon}>↩️</span>
                        返回上页
                    </button>
                </div>

                {/* 功能特性 */}
                <div className={styles.features}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>🎯</div>
                        <span>精准狩猎</span>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>🌲</div>
                        <span>自然环境</span>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>🏆</div>
                        <span>荣誉奖杯</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;