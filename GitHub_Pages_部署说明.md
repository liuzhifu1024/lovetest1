# GitHub Pages 部署说明

## 路径检查结果

✅ **所有路径都已经是相对路径，完全适配GitHub Pages部署**

### 已确认的相对路径

#### HTML文件中的资源引用
- `css/style.css`
- `css/consent.css`
- `css/info.css`
- `css/test.css`
- `css/report.css`
- `js/storage.js`
- `js/config.js`
- `js/utils.js`
- `js/main.js`
- `js/test.js`
- `js/report.js`

#### JavaScript中的页面跳转
- `index.html`
- `test.html`
- `consent.html`
- `info.html`
- `report.html`
- `rpi-detail.html`

#### 数据文件
- `questionBank.json`

#### 特殊说明
- `config.js`中的`/api/...`路径仅为注释，不影响运行

## 部署步骤

### 1. 准备GitHub仓库
```bash
# 如果还没有推送到GitHub
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 2. 启用GitHub Pages
1. 进入GitHub仓库页面
2. 点击 `Settings`（设置）
3. 在左侧菜单找到 `Pages`
4. 在 `Source` 部分选择：
   - Branch: `main`（或`master`）
   - Folder: `/ (root)`（根目录）
5. 点击 `Save`（保存）

### 3. 访问网站
部署完成后，访问地址为：
```
https://你的用户名.github.io/仓库名/
```

如果仓库名是 `lovetest20251104`，则访问：
```
https://你的用户名.github.io/lovetest20251104/
```

## 文件结构要求

确保文件结构如下：
```
仓库根目录/
├── index.html          # 首页（必须）
├── consent.html
├── info.html
├── test.html
├── report.html
├── rpi-detail.html
├── questionBank.json
├── css/
│   ├── style.css
│   ├── consent.css
│   ├── info.css
│   ├── test.css
│   └── report.css
└── js/
    ├── storage.js
    ├── config.js
    ├── utils.js
    ├── main.js
    ├── test.js
    └── report.js
```

## 注意事项

1. ✅ **所有路径都是相对路径** - 无需修改
2. ✅ **不包含绝对路径** - 已确认
3. ✅ **适配GitHub Pages** - 可以直接部署

## 测试清单

部署后请测试：
- [ ] 首页能正常打开
- [ ] CSS样式正常显示
- [ ] JavaScript功能正常
- [ ] 授权码验证弹窗正常
- [ ] 页面跳转正常（知情同意→个人信息→答题→报告）
- [ ] 题库JSON文件能正常加载
- [ ] 测试报告能正常生成和显示
- [ ] 测试记录页面能正常显示
- [ ] 所有按钮和链接正常工作

## 常见问题

### Q: 页面显示404？
A: 确保`index.html`在仓库根目录，并检查GitHub Pages设置中的分支和文件夹配置。

### Q: CSS样式没有加载？
A: 检查CSS文件路径是否为相对路径，确保文件结构正确。

### Q: JavaScript功能不工作？
A: 检查浏览器控制台是否有错误，确认所有JS文件路径正确。

### Q: 题库文件加载失败？
A: 确保`questionBank.json`在根目录，且路径为相对路径`questionBank.json`。

## 当前状态

✅ **所有路径已统一为相对路径，可直接部署到GitHub Pages**

