import '../../common/global.css';
import styles from './home.module.css';

import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectUser, logout } from '../../store/userSlice';
import { uploadImage } from '../../utils/api';
import data from "../../common/data"
import Dropdowns from '../../components/dropdowns';
import Landscape from '../Landscape/landscape';
import Trophy from '../Trophy/trophy';

const Home = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [hoveredArea, setHoveredArea] = useState(null)
    const [selectedAnimal, setSelectedAnimal] = useState(null)
    const [selectedArea, setSelectedArea] = useState(null)
    const [currentView, setCurrentView] = useState('default') // 'default', 'landscape', 'trophy'
    const [selectedUploadArea, setSelectedUploadArea] = useState(null)
    const [selectedUploadAnimal, setSelectedUploadAnimal] = useState(null)
    const [selectedUploadAnimalRating, setSelectedUploadAnimalRating] = useState(null)
    const [areaDropdownOpen, setAreaDropdownOpen] = useState(false)
    const [animalDropdownOpen, setAnimalDropdownOpen] = useState(false)
    const [ratingDropdownOpen, setRatingDropdownOpen] = useState(false)
    const [showUploadForm, setShowUploadForm] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    
    
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
            setShowUploadForm(true)
            // 重置选择状态
            setSelectedUploadArea(null)
            setSelectedUploadAnimal(null)
            setSelectedUploadAnimalRating(null)
            console.log('选择的文件:', file.name)
        }
    }

    const handleUploadClick = () => {
        if (!isLoggedIn) {
            alert('请先登录后再分享图片')
            navigate('/login')
            return
        }
        
        document.getElementById('fileInput').click()
    }

    // 验证信息是否完整
    const isInfoComplete = () => {
        if (!selectedUploadArea || !selectedUploadAnimal) {
            return false
        }
        // 如果选择的是动物，需要选择评级；如果是风景，不需要评级
        if (selectedUploadAnimal !== '风景' && !selectedUploadAnimalRating) {
            return false
        }
        return true
    }

    // 将文件转换为base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = error => reject(error)
        })
    }

    // 处理图片上传
    const handleImageUpload = async () => {
        if (!isInfoComplete()) {
            alert('请完善所有必要信息后再上传')
            return
        }

        if (!selectedFile) {
            alert('请选择图片文件')
            return
        }

        setIsUploading(true)

        try {
            // 将文件转换为base64
            const imageData = await fileToBase64(selectedFile)
            
            // 评级转换为数字（如果是风景则为0）
            let rating = 0
            if (selectedUploadAnimal !== '风景') {
                const ratingMap = {
                    '无评级': 0,
                    '青铜': 1,
                    '白银': 2,
                    '黄金': 3,
                    '钻石': 4,
                    '奇珍异兽': 5
                }
                rating = ratingMap[selectedUploadAnimalRating] || 0
            }

            const uploadData = {
                imageData: imageData,
                areaName: selectedUploadArea,
                animalName: selectedUploadAnimal,
                rating: rating,
                uploaderId: user.id,
                uploaderNickname: user.nickname
            }

            const response = await uploadImage(uploadData)
            
            if (response.code === 200) {
                // 清空表单
                setSelectedFile(null)
                setShowUploadForm(false)
                setSelectedUploadArea(null)
                setSelectedUploadAnimal(null)
                setSelectedUploadAnimalRating(null)
                // 重置文件输入
                document.getElementById('fileInput').value = ''
            }

        } catch (error) {
            console.error('上传失败:', error)
            alert('上传失败，请稍后重试')
        } finally {
            setIsUploading(false)
        }
    }

    // 处理动物或风景选择
    const handleAnimalSelection = (animalName, areaData) => {
        setSelectedAnimal(animalName)
        setSelectedArea(areaData)
        
        if (animalName === '风景') {
            setCurrentView('landscape')
        } else {
            setCurrentView('trophy')
        }
    }

    // 监听selectedAnimal的变化，更新视图
    useEffect(() => {
        if (selectedAnimal === '风景') {
            setCurrentView('landscape')
        } else if (selectedAnimal && selectedAnimal !== '风景') {
            setCurrentView('trophy')
        }
    }, [selectedAnimal])

    // 渲染主内容区域
    const renderMainContent = () => {
        switch (currentView) {
            case 'landscape':
                return <Landscape selectedArea={selectedArea} />
            case 'trophy':
                return <Trophy selectedAnimal={selectedAnimal} selectedArea={selectedArea} />
            default:
                return (
                    <div className={styles.defaultContent}>
                        <div className={styles.welcomeSection}>
                            <h2>🌲 欢迎来到猎人传说 🦌</h2>
                            <p>选择上方菜单中的区域和动物，探索精彩的狩猎世界</p>
                            <div className={styles.featureGrid}>
                                <div className={styles.featureCard}>
                                    <h3>🏞️ 风景欣赏</h3>
                                    <p>浏览各个区域的绝美风景，感受大自然的魅力</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <h3>🏆 动物奖杯</h3>
                                    <p>查看各种动物的详细信息和狩猎记录</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <h3>📸 分享时刻</h3>
                                    <p>上传你的狩猎照片，与其他猎人分享精彩瞬间</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
        }
    }

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
                                    setSelectedAnimal={handleAnimalSelection}
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
                    {renderMainContent()}
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
                            
                            {selectedFile && showUploadForm && (
                                <div className={styles.threeSelectsOut}>
                                    <div className={styles.fileInfo}>
                                        已选择: {selectedFile.name}  请完善图片信息：
                                    </div>
                                    <div className={styles.threeSelects}>
                                        <div className={styles.customSelect}>
                                            <div className={styles.selectTrigger} onClick={() => setAreaDropdownOpen(!areaDropdownOpen)}>
                                                {selectedUploadArea || '选择区域'}
                                            </div>
                                            {areaDropdownOpen && (
                                                <ul className={styles.selectOptions}>
                                                    {area.maps.map((map, i) => (
                                                        <li 
                                                            key={i} 
                                                            className={styles.selectOption}
                                                            onClick={() => {
                                                                setSelectedUploadArea(map.area);
                                                                setAreaDropdownOpen(false);
                                                                setSelectedUploadAnimal(null);
                                                                setSelectedUploadAnimalRating(null);
                                                            }}
                                                        >
                                                            {map.area}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className={styles.customSelect}>
                                            <div className={styles.selectTrigger} onClick={() => setAnimalDropdownOpen(!animalDropdownOpen)}>
                                                {selectedUploadAnimal || '选择动物或风景'}
                                            </div>
                                            {animalDropdownOpen && selectedUploadArea && (
                                                <ul className={styles.selectOptions}>
                                                    {area.maps
                                                        .filter((map) => map.area === selectedUploadArea)
                                                        .flatMap((map) => map.animals.map((animal, i) => (
                                                            <li 
                                                                key={i} 
                                                                className={styles.selectOption}
                                                                onClick={() => {
                                                                    setSelectedUploadAnimal(animal.name);
                                                                    setAnimalDropdownOpen(false);
                                                                    setSelectedUploadAnimalRating(null);
                                                                }}
                                                            >
                                                                {animal.name}
                                                            </li>
                                                        )))
                                                    }
                                                    <li 
                                                        key="landscape" 
                                                        className={styles.selectOption}
                                                        onClick={() => {
                                                            setSelectedUploadAnimal('风景');
                                                            setAnimalDropdownOpen(false);
                                                            setSelectedUploadAnimalRating('风景');
                                                        }}
                                                    >
                                                        风景
                                                    </li>
                                                </ul>
                                            )}
                                        </div>
                                        <div className={styles.customSelect}>
                                            <div className={styles.selectTrigger} onClick={() => setRatingDropdownOpen(!ratingDropdownOpen)}>
                                                {selectedUploadAnimal === '风景' ? '风景' : (selectedUploadAnimalRating || '选择评级')}
                                            </div>
                                            {ratingDropdownOpen && selectedUploadAnimal && selectedUploadAnimal !== '风景' && (
                                                <ul className={styles.selectOptions}>
                                                    {
                                                        ['无评级', '青铜', '白银', '黄金', '钻石', '奇珍异兽'].map((rating, i) => (
                                                            <li 
                                                                key={i} 
                                                                className={styles.selectOption}
                                                                onClick={() => {
                                                                    setSelectedUploadAnimalRating(rating);
                                                                    setRatingDropdownOpen(false);
                                                                }}
                                                            >
                                                                {rating}
                                                            </li>
                                                        ))
                                                    }
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* 上传按钮和操作区域 */}
                                    <div className={styles.uploadActions}>
                                        <button 
                                            className={`${styles.uploadButton} ${styles.finalUploadBtn}`}
                                            onClick={handleImageUpload}
                                            disabled={!isInfoComplete() || isUploading}
                                        >
                                            {isUploading ? '上传中...' : '上传图片'}
                                        </button>
                                        <button 
                                            className={`${styles.uploadButton} ${styles.cancelBtn}`}
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setShowUploadForm(false);
                                                setSelectedUploadArea(null);
                                                setSelectedUploadAnimal(null);
                                                setSelectedUploadAnimalRating(null);
                                                document.getElementById('fileInput').value = '';
                                            }}
                                            disabled={isUploading}
                                        >
                                            取消
                                        </button>
                                    </div>
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