import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUserAsync } from '../../store/userThunks';
import { selectUserLoading, selectUserError, clearError } from '../../store/userSlice';
import styles from './login.module.css';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // 从Redux获取状态
    const isLoading = useSelector(selectUserLoading);
    const globalError = useSelector(selectUserError);
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 处理输入变化
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // 清除对应字段的错误信息
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // 验证表单
    const validateForm = () => {
        const newErrors = {};

        // 验证邮箱
        if (!formData.email.trim()) {
            newErrors.email = '请输入邮箱';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '请输入有效的邮箱地址';
        }

        // 验证密码
        if (!formData.password) {
            newErrors.password = '请输入密码';
        } else if (formData.password.length < 6) {
            newErrors.password = '密码至少需要6个字符';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 处理表单提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({}); // 清除之前的错误
        dispatch(clearError()); // 清除Redux中的错误

        try {
            // 使用Redux异步action
            const result = await dispatch(loginUserAsync({
                email: formData.email.trim(),
                password: formData.password,
                rememberMe: formData.rememberMe
            })).unwrap(); // unwrap用于获取实际的结果或抛出错误

            // 登录成功，跳转到用户页面
            navigate('/user');
            
        } catch (error) {
            // 处理登录错误
            setErrors({ 
                general: error.message || '登录失败，请检查您的邮箱和密码' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 处理忘记密码
    const handleForgotPassword = () => {
        alert('忘记密码功能待实现');
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginBox}>
                <h1 className={styles.title}>欢迎回来</h1>
                
                <form className={styles.form} onSubmit={handleSubmit}>
                    {/* 通用错误信息 */}
                    {errors.general && (
                        <div className={styles.errorMessage} style={{ textAlign: 'center', marginBottom: '10px' }}>
                            {errors.general}
                        </div>
                    )}

                    {/* 邮箱输入 */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>邮箱</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="请输入邮箱地址"
                            className={styles.input}
                            disabled={isSubmitting}
                        />
                        <div className={styles.errorMessage}>
                            {errors.email}
                        </div>
                    </div>

                    {/* 密码输入 */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>密码</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="请输入密码"
                            className={styles.input}
                            disabled={isSubmitting}
                        />
                        <div className={styles.errorMessage}>
                            {errors.password}
                        </div>
                    </div>

                    {/* 记住我和忘记密码 */}
                    <div className={styles.optionsRow}>
                        <label className={styles.rememberMe}>
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleInputChange}
                                className={styles.checkbox}
                                disabled={isSubmitting}
                            />
                            记住我
                        </label>
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className={styles.forgotPassword}
                            disabled={isSubmitting}
                        >
                            忘记密码？
                        </button>
                    </div>

                    {/* 提交按钮 */}
                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '登录中...' : '登录'}
                    </button>
                </form>

                {/* 分割线 */}
                <div className={styles.divider}>或</div>

                {/* 注册链接 */}
                <div className={styles.registerLink}>
                    还没有账户？ <Link to="/register">立即注册</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;