# 图片上传功能 - 数据库设计文档

## 数据库集合 (Collections)

### 1. images 集合
用于存储图片信息和数据

**字段结构：**
```javascript
{
  _id: ObjectId,                    // 自动生成的唯一ID
  areaName: String,                 // 区域名称 (如: "科德湖", "拉顿峡谷")
  animalName: String,               // 动物名称 (如: "白尾鹿", "黑熊")
  rating: Number,                   // 用户评分 (1-5星)
  uploaderId: String,               // 上传者用户ID
  uploaderNickname: String,         // 上传者昵称
  description: String,              // 图片描述 (可选)
  imageData: String,                // base64编码的图片数据
  uploadTime: Date,                 // 上传时间
  createdAt: Date,                  // 创建时间
  updatedAt: Date,                  // 更新时间
  isActive: Boolean,                // 是否活跃 (用于软删除)
  viewCount: Number,                // 浏览次数
  likeCount: Number,                // 点赞次数
  tags: Array<String>,              // 标签数组 (便于搜索)
  fileSize: Number,                 // 文件大小 (字节)
  imageType: String,                // 图片类型 (如: "image/jpeg")
  
  // 删除相关字段 (软删除时使用)
  deletedAt: Date,                  // 删除时间 (可选)
  deletedBy: String,                // 删除者ID (可选)
  deleteReason: String              // 删除原因 (可选)
}
```

**建议索引：**
```javascript
// 1. 复合索引 - 用于列表查询和筛选
{ "isActive": 1, "uploadTime": -1 }
{ "isActive": 1, "areaName": 1, "uploadTime": -1 }
{ "isActive": 1, "animalName": 1, "uploadTime": -1 }
{ "isActive": 1, "rating": -1, "uploadTime": -1 }
{ "uploaderId": 1, "isActive": 1 }

// 2. 文本索引 - 用于搜索
{ "areaName": "text", "animalName": "text", "description": "text" }
```

### 2. imageLikes 集合
用于存储图片点赞关系

**字段结构：**
```javascript
{
  _id: ObjectId,                    // 自动生成的唯一ID
  imageId: String,                  // 图片ID
  userId: String,                   // 点赞用户ID
  createdAt: Date                   // 点赞时间
}
```

**建议索引：**
```javascript
// 复合唯一索引 - 确保用户不能重复点赞同一张图片
{ "imageId": 1, "userId": 1 }  // unique: true

// 单独索引
{ "imageId": 1 }
{ "userId": 1 }
```

### 3. users 集合 (已存在，需要扩展)
需要在现有用户集合中添加一些字段

**新增字段：**
```javascript
{
  // ... 现有字段
  profile: {
    // ... 现有profile字段
    uploadCount: Number,            // 上传图片数量
    // experience: Number,          // 经验值 (已存在)
  },
  role: String,                     // 用户角色 (如: "user", "admin")
  isAdmin: Boolean                  // 是否是管理员
}
```

## 云函数说明

### 1. uploadImage.ts
**功能：** 上传图片
**接口：** POST /uploadImage
**参数：**
- imageData (String): base64编码的图片数据
- areaName (String): 区域名称
- animalName (String): 动物名称
- rating (Number): 评分 (1-5)
- uploaderId (String): 上传者ID
- uploaderNickname (String): 上传者昵称
- description (String, 可选): 图片描述

### 2. getImages.ts
**功能：** 获取图片列表 (分页、筛选、排序)
**接口：** POST /getImages
**参数：**
- page (Number, 可选): 页码，默认1
- limit (Number, 可选): 每页数量，默认10
- areaName (String, 可选): 筛选区域
- animalName (String, 可选): 筛选动物
- uploaderId (String, 可选): 筛选上传者
- minRating (Number, 可选): 最低评分
- sortBy (String, 可选): 排序字段
- sortOrder (String, 可选): 排序方向

### 3. getImageDetail.ts
**功能：** 获取图片详情 (包含完整图片数据)
**接口：** POST /getImageDetail
**参数：**
- imageId (String): 图片ID

### 4. toggleImageLike.ts
**功能：** 切换图片点赞状态
**接口：** POST /toggleImageLike
**参数：**
- imageId (String): 图片ID
- userId (String): 用户ID

### 5. deleteImage.ts
**功能：** 删除图片 (软删除)
**接口：** POST /deleteImage
**参数：**
- imageId (String): 图片ID
- userId (String): 用户ID
- reason (String, 可选): 删除原因

## 使用说明

1. **图片存储：** 图片以base64格式直接存储在数据库中，适合小到中等大小的图片
2. **安全性：** 所有操作都需要验证用户身份和权限
3. **性能优化：** 列表查询时不返回完整图片数据，只在详情查询时返回
4. **软删除：** 删除图片时只标记为不活跃，便于数据恢复
5. **统计功能：** 自动更新用户的上传统计和经验值

## 注意事项

1. **图片大小限制：** 当前限制为5MB，可根据需要调整
2. **索引优化：** 建议根据实际查询模式创建合适的索引
3. **缓存策略：** 可考虑为热门图片添加缓存机制
4. **图片压缩：** 建议在前端上传前进行图片压缩
5. **备份策略：** 重要图片数据需要定期备份
