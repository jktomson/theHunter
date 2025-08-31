import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUserAsync } from '../../store/userThunks';
import { selectUserLoading, selectUserError, clearError } from '../../store/userSlice';
import styles from './register.module.css';

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // 从Redux获取状态
    const isLoading = useSelector(selectUserLoading);
    const globalError = useSelector(selectUserError);
    
    const [formData, setFormData] = useState({
        nickname: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 处理输入变化
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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

        // 验证昵称
        if (!formData.nickname.trim()) {
            newErrors.nickname = '请输入昵称';
        } else if (formData.nickname.trim().length < 2) {
            newErrors.nickname = '昵称至少需要2个字符';
        } else if (formData.nickname.trim().length > 20) {
            newErrors.nickname = '昵称不能超过20个字符';
        }

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
        } else if (formData.password.length > 20) {
            newErrors.password = '密码不能超过20个字符';
        }

        // 验证确认密码
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = '请确认密码';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '两次输入的密码不一致';
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
            const result = await dispatch(registerUserAsync({
                nickname: formData.nickname.trim(),
                email: formData.email.trim(),
                password: formData.password
            })).unwrap(); // unwrap用于获取实际的结果或抛出错误

            // 注册成功，跳转到登录页面
            alert('注册成功！请登录您的账户。');
            navigate('/login');
            
        } catch (error) {
            // 处理注册错误
            if (error.message.includes('邮箱')) {
                setErrors({ email: error.message });
            } else if (error.message.includes('昵称')) {
                setErrors({ nickname: error.message });
            } else {
                setErrors({ 
                    general: error.message || '注册失败，请重试' 
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.registerBox}>
                <h1 className={styles.title}>注册账户</h1>
                
                <form className={styles.form} onSubmit={handleSubmit}>
                    {/* 昵称输入 */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>昵称</label>
                        <input
                            type="text"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleInputChange}
                            placeholder="请输入昵称"
                            className={styles.input}
                            disabled={isSubmitting}
                        />
                        <div className={styles.errorMessage}>
                            {errors.nickname}
                        </div>
                    </div>

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

                    {/* 确认密码输入 */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>确认密码</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="请再次输入密码"
                            className={styles.input}
                            disabled={isSubmitting}
                        />
                        <div className={styles.errorMessage}>
                            {errors.confirmPassword}
                        </div>
                    </div>

                    {/* 提交按钮 */}
                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '注册中...' : '注册'}
                    </button>
                </form>

                {/* 登录链接 */}
                <div className={styles.loginLink}>
                    已有账户？ <Link to="/login">立即登录</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;