import { useState } from "react";
import styles from '../pages/Home/home.module.css';

function Dropdowns({ map, i, hoveredArea, setHoveredArea, setSelectedAnimal }) {
    const [hoveredAnimal, setHoveredAnimal] = useState(null);

    return (
        <div 
            key={i}
            className={styles.areaContainer}
            onMouseEnter={() => setHoveredArea(map)}
            onMouseLeave={() => setHoveredArea(null)}
        >
            <span className={styles.areaName}>
                {map.area}
            </span>
            {/* 悬停时显示动物列表 */}
            {hoveredArea && hoveredArea.area === map.area && (
                <div>
                    {/* 透明连接桥梁 */}
                    <div className={styles.tooltipBridge}></div>
                    <div className={styles.animalTooltip}>
                        <h4 className={hoveredAnimal ? styles.animalTitleHovered : ''}>动物:</h4>
                        <ul>
                            {hoveredArea.animals.map((animal, index) => (
                                <li 
                                    key={index}
                                    onMouseEnter={() => setHoveredAnimal(animal.name)}
                                    onMouseLeave={() => setHoveredAnimal(null)}
                                    onClick={() => setSelectedAnimal(animal.name)}
                                >
                                    {animal.name}
                                </li>
                            ))}
                        </ul>
                        <h4 onClick={() => setSelectedAnimal('风景')}>风景</h4>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dropdowns