import '../../common/global.css';
import styles from './home.module.css';

import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectUser, logout } from '../../store/userSlice';
import data from "../../common/data"
import Dropdowns from '../../components/dropdowns';

const Home = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [hoveredArea, setHoveredArea] = useState(null)
    const [selectedAnimal, setSelectedAnimal] = useState(null)
    
    // 从Redux获取用户状态
    const isLoggedIn = useSelector(selectIsAuthenticated)
    const user = useSelector(selectUser)
    
    let area = data

    const handleLogout = () => {
        if (window.confirm('确定要退出登录吗？')) {
            dispatch(logout())
        }
    }

    const [selectedFile, setSelectedFile] = useState(null)

    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file) {
            setSelectedFile(file)
            console.log('选择的文件:', file.name)
        }
    }

    const handleUploadClick = () => {
        document.getElementById('fileInput').click()
    }

    // 监听selectedAnimal的变化，执行相应的导航
    useEffect(() => {
        if (selectedAnimal === '风景') {
            navigate('/home')
        } else if (selectedAnimal && selectedAnimal !== '风景') {
            navigate('trophy')
        }
    }, [selectedAnimal, navigate])

    return (
        <>
            <div className={styles.allreturn}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        {/* <img src="/white.webp" alt="Logo" className={styles.logo} /> */}
                        <img src={`${process.env.PUBLIC_URL}/white.webp`} alt="Logo" className={styles.logo} />
                    </div>
                    <nav className={styles.headerCenter}>
                        {
                            area.maps && area.maps.map((map, i) => (
                                <Dropdowns 
                                    key={i}
                                    map={map} 
                                    i={i} 
                                    hoveredArea={hoveredArea}
                                    setHoveredArea={setHoveredArea}
                                    setSelectedAnimal={setSelectedAnimal}
                                />
                            ))
                        }
                    </nav>
                    <div className={styles.headerRight}>
                        {isLoggedIn ? (
                            // 登录后显示用户信息和退出按钮
                            <div className={styles.userSection}>
                                <span className={styles.welcomeText}>
                                    欢迎! {user?.nickname}
                                </span>
                                <button 
                                    className={styles.btn} 
                                    onClick={() => navigate('/user')}
                                >
                                    个人中心
                                </button>
                                <button 
                                    className={styles.btn + ' ' + styles.logoutBtn} 
                                    onClick={handleLogout}
                                >
                                    退出
                                </button>
                            </div>
                        ) : (
                            // 未登录时显示注册和登录按钮
                            <div>
                                <button className={styles.btn} onClick={() => navigate('/register')}>注册</button>
                                <button className={styles.btn} onClick={() => navigate('/login')}>登录</button>
                            </div>
                        )}
                    </div>
                </header>
                <main>
                    <Outlet></Outlet>
                </main>
                <footer>
                    <div className={styles.footerContent}>
                        <h3 className={styles.footerText}>分享你的狩猎瞬间</h3>
                        
                        <div className={styles.uploadContainer}>
                            <button 
                                className={styles.uploadButton}
                                onClick={handleUploadClick}
                            >
                                <span className={styles.uploadIcon}>📸</span>
                                选择图片分享
                            </button>
                            
                            <input
                                id="fileInput"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className={styles.fileInput}
                            />
                            
                            {selectedFile && (
                                <div className={styles.fileInfo}>
                                    已选择: {selectedFile.name}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className={styles.footerBottom}>
                        <p>© 2025 猎人传说 - 与自然共舞的狩猎体验</p>
                        <p>🌲 探索 · 发现 · 分享 🦌</p>
                    </div>
                </footer>
            </div>
        </>
    )
}

export default Home