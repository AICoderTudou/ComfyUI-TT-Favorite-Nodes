/**
 * ComfyUI Node History Plugin - Frontend
 * Adds a draggable button for quickly accessing frequently used nodes
 */
console.log('=== TT NodeHistory Plugin Loading ===');

// 立即检查localStorage状态
console.log('TT Immediate localStorage check:');
console.log('TT localStorage available:', typeof Storage !== 'undefined');
console.log('TT Current TTcustomCommonNodes data:', localStorage.getItem('TTcustomCommonNodes'));

// 全局变量
let TTnodeHistory = [];
const TTMAX_HISTORY = 50;

// 鼠标位置跟踪
let TTlastMousePosition = { x: 100, y: 100 };

// 常用节点配置
const TTCOMMON_NODES = [
    { type: 'KSampler', title: 'KSampler', category: '采样器' },
    { type: 'CheckpointLoaderSimple', title: '加载检查点', category: '加载器' },
    { type: 'CLIPTextEncode', title: '文本编码', category: '条件' },
    { type: 'VAEDecode', title: 'VAE解码', category: 'VAE' },
    { type: 'SaveImage', title: '保存图像', category: '图像' },
    { type: 'EmptyLatentImage', title: '空潜在图像', category: '潜在' },
    { type: 'LoraLoader', title: '加载LoRA', category: '加载器' },
    { type: 'PreviewImage', title: '预览图像', category: '图像' },
    { type: 'UpscaleModelLoader', title: '放大模型加载器', category: '加载器' },
    { type: 'ImageUpscaleWithModel', title: '模型放大图像', category: '图像' }
];

// 自定义常用节点数组 - 这个会被localStorage数据覆盖
let TTcustomCommonNodes = [];

// 立即尝试加载自定义节点数据
console.log('TT Attempting immediate load of custom nodes...');
try {
    const saved = localStorage.getItem('TTcustomCommonNodes');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            TTcustomCommonNodes = parsed;
            console.log('TT Immediate load successful:', TTcustomCommonNodes.length, 'nodes loaded');
        }
    } else {
        console.log('TT No saved data found for immediate load');
    }
} catch (error) {
    console.error('TT Immediate load failed:', error);
}

// 按钮位置
let TTbuttonPosition = { x: 20, y: 20 };

// 保存历史记录到localStorage
function TTsaveHistory() {
    try {
        localStorage.setItem('TTnodeHistory', JSON.stringify(TTnodeHistory));
        console.log('TT History saved:', TTnodeHistory.length, 'items');
    } catch (error) {
        console.error('TT Error saving history:', error);
    }
}

function TTloadHistory() {
    try {
        const saved = localStorage.getItem('TTnodeHistory');
        if (saved) {
            TTnodeHistory = JSON.parse(saved);
            console.log('TT History loaded:', TTnodeHistory.length, 'items');
        }
    } catch (error) {
        console.error('TT Error loading history:', error);
        TTnodeHistory = [];
    }
}

function TTsaveButtonPosition() {
    try {
        localStorage.setItem('TTbuttonPosition', JSON.stringify(TTbuttonPosition));
    } catch (error) {
        console.error('TT Error saving button position:', error);
    }
}

function TTloadButtonPosition() {
    try {
        const saved = localStorage.getItem('TTbuttonPosition');
        if (saved) {
            TTbuttonPosition = JSON.parse(saved);
        }
    } catch (error) {
        console.error('TT Error loading button position:', error);
        TTbuttonPosition = { x: 20, y: 20 };
    }
}

// 自定义常用节点管理
function TTsaveCustomCommonNodes() {
    try {
        localStorage.setItem('TTcustomCommonNodes', JSON.stringify(TTcustomCommonNodes));
        console.log('TT Custom common nodes saved:', TTcustomCommonNodes.length, 'items');
        console.log('TT Saved nodes:', TTcustomCommonNodes);
        
        // 验证保存是否成功
        const verification = localStorage.getItem('TTcustomCommonNodes');
        if (verification) {
            console.log('TT Save verification successful');
        } else {
            console.error('TT Save verification failed - data not found in localStorage');
        }
    } catch (error) {
        console.error('TT Error saving custom common nodes:', error);
    }
}

function TTloadCustomCommonNodes() {
    console.log('TT === Starting to load custom common nodes ===');
    try {
        const saved = localStorage.getItem('TTcustomCommonNodes');
        console.log('TT Raw localStorage data:', saved);
        
        if (saved) {
            const parsed = JSON.parse(saved);
            console.log('TT Parsed data:', parsed);
            
            // 确保数据格式正确
            if (Array.isArray(parsed)) {
                TTcustomCommonNodes = parsed;
                console.log('TT Custom common nodes loaded successfully:', TTcustomCommonNodes.length, 'items');
                console.log('TT Loaded nodes details:', TTcustomCommonNodes);
                
                // 立即验证全局变量
                console.log('TT Global TTcustomCommonNodes after loading:', TTcustomCommonNodes);
            } else {
                console.warn('TT Invalid custom common nodes format, resetting');
                TTcustomCommonNodes = [];
            }
        } else {
            console.log('TT No saved custom common nodes found in localStorage');
            TTcustomCommonNodes = [];
        }
        
        // 最终状态检查
        console.log('TT Final TTcustomCommonNodes state:', TTcustomCommonNodes);
        console.log('TT === Custom common nodes loading completed ===');
        
    } catch (error) {
        console.error('TT Error loading custom common nodes:', error);
        TTcustomCommonNodes = [];
    }
}

function TTaddToCustomCommonNodes(nodeType, nodeTitle) {
    // 检查是否已存在
    const exists = TTcustomCommonNodes.some(node => node.type === nodeType);
    if (exists) {
        return { success: false, message: '节点已在常用列表中' };
    }
    
    // 限制数量
    if (TTcustomCommonNodes.length >= 20) {
        return { success: false, message: '常用节点已达上限(20个)' };
    }
    
    // 添加节点
    TTcustomCommonNodes.push({
        type: nodeType,
        title: nodeTitle || nodeType,
        addedAt: Date.now()
    });
    
    // 保存到localStorage
    TTsaveCustomCommonNodes();
    
    return { success: true, message: '已添加到常用节点' };
}

// 获取所有可用节点
function TTgetAllAvailableNodes() {
    try {
        const nodes = [];
        
        if (window.LiteGraph && window.LiteGraph.registered_node_types) {
            const nodeTypes = window.LiteGraph.registered_node_types;
            
            for (const [nodeType, NodeClass] of Object.entries(nodeTypes)) {
                // 跳过一些内部节点
                if (nodeType.startsWith('_') || nodeType.includes('Reroute')) {
                    continue;
                }
                
                let title = nodeType;
                let category = 'other';
                let description = '';
                
                // 尝试获取节点信息
                if (NodeClass) {
                    if (NodeClass.title) {
                        title = NodeClass.title;
                    }
                    if (NodeClass.category) {
                        category = NodeClass.category;
                    }
                    if (NodeClass.desc || NodeClass.description) {
                        description = NodeClass.desc || NodeClass.description;
                    }
                }
                
                // 根据节点类型推断分类
                if (nodeType.includes('Sampler')) category = '采样器';
                else if (nodeType.includes('Loader') || nodeType.includes('Load')) category = '加载器';
                else if (nodeType.includes('Encode') || nodeType.includes('Decode')) category = '编码';
                else if (nodeType.includes('Image')) category = '图像';
                else if (nodeType.includes('Text') || nodeType.includes('CLIP')) category = '文本';
                else if (nodeType.includes('VAE')) category = 'VAE';
                else if (nodeType.includes('Model')) category = '模型';
                else if (nodeType.includes('Latent')) category = '潜在';
                
                nodes.push({
                    type: nodeType,
                    title: title,
                    category: category,
                    description: description
                });
            }
        }
        
        return nodes;
    } catch (error) {
        console.error('TT Error getting available nodes:', error);
        return [];
    }
}

// 搜索节点
function TTsearchNodes(query) {
    if (!query || query.trim() === '') {
        return [];
    }
    
    const allNodes = TTgetAllAvailableNodes();
    const searchTerm = query.toLowerCase();
    
    return allNodes.filter(node => 
        node.type.toLowerCase().includes(searchTerm) ||
        node.title.toLowerCase().includes(searchTerm) ||
        node.category.toLowerCase().includes(searchTerm) ||
        node.description.toLowerCase().includes(searchTerm)
    ).slice(0, 50); // 限制结果数量
}

function TTremoveFromCustomCommonNodes(nodeType) {
    const originalLength = TTcustomCommonNodes.length;
    TTcustomCommonNodes = TTcustomCommonNodes.filter(node => node.type !== nodeType);
    TTsaveCustomCommonNodes();
    
    const removed = originalLength > TTcustomCommonNodes.length;
    return {
        success: removed,
        message: removed ? '已从常用节点中移除' : '节点不在常用列表中'
    };
}

function TTdisplaySearchResults(query, container, menu, event) {
    if (!query || query.trim() === '') {
        TTdisplayCommonNodes(container, menu, event);
        return;
    }
    
    const results = TTsearchNodes(query);
    container.innerHTML = '';
    
    if (results.length === 0) {
        const noResults = document.createElement('div');
        noResults.textContent = '未找到匹配的节点';
        noResults.style.cssText = `
            padding: 16px;
            text-align: center;
            color: #999;
            font-style: italic;
        `;
        container.appendChild(noResults);
        return;
    }
    
    // 按分类分组
    const categories = {};
    results.forEach(node => {
        if (!categories[node.category]) {
            categories[node.category] = [];
        }
        categories[node.category].push(node);
    });
    
    // 显示分类和节点
    Object.entries(categories).forEach(([category, nodes]) => {
        // 分类标题
        const categoryTitle = document.createElement('div');
        categoryTitle.textContent = `📁 ${category}`;
        categoryTitle.style.cssText = `
            padding: 8px 16px;
            background: #333;
            color: #fff;
            font-weight: bold;
            border-bottom: 1px solid #555;
            font-size: 11px;
        `;
        container.appendChild(categoryTitle);
        
        // 节点列表
        nodes.forEach(node => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 1px solid #444;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
                font-size: 12px;
            `;
            
            const nodeInfo = document.createElement('div');
            nodeInfo.style.cssText = `
                flex: 1;
                overflow: hidden;
            `;
            
            const nodeTitle = document.createElement('div');
            nodeTitle.textContent = node.title;
            nodeTitle.style.cssText = `
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            
            const nodeType = document.createElement('div');
            nodeType.textContent = node.type;
            nodeType.style.cssText = `
                font-size: 10px;
                color: #999;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            
            nodeInfo.appendChild(nodeTitle);
            nodeInfo.appendChild(nodeType);
            item.appendChild(nodeInfo);
            
            // 添加到常用节点按钮
            const addButton = document.createElement('button');
            
            // 检查节点是否已经收藏
            const isAlreadyFavorited = TTcustomCommonNodes.some(customNode => customNode.type === node.type);
            
            addButton.textContent = isAlreadyFavorited ? '★' : '⭐';
            addButton.title = isAlreadyFavorited ? '已收藏' : '添加到常用节点';
            addButton.style.cssText = `
                background: none;
                border: 1px solid ${isAlreadyFavorited ? '#FFD700' : '#666'};
                color: ${isAlreadyFavorited ? '#FFD700' : '#999'};
                border-radius: 3px;
                padding: 2px 6px;
                cursor: pointer;
                font-size: 12px;
                margin-left: 8px;
                transition: all 0.2s;
            `;
            
            addButton.addEventListener('mouseenter', function() {
                if (isAlreadyFavorited) {
                    this.style.background = '#FFD700';
                    this.style.color = 'black';
                    this.style.borderColor = '#FFD700';
                } else {
                    this.style.background = '#4CAF50';
                    this.style.color = 'white';
                    this.style.borderColor = '#4CAF50';
                }
            });
            
            addButton.addEventListener('mouseleave', function() {
                this.style.background = 'none';
                if (isAlreadyFavorited) {
                    this.style.color = '#FFD700';
                    this.style.borderColor = '#FFD700';
                } else {
                    this.style.color = '#999';
                    this.style.borderColor = '#666';
                }
            });
            
            addButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // 动态检查当前收藏状态
                const currentlyFavorited = TTcustomCommonNodes.some(customNode => customNode.type === node.type);
                
                let result;
                if (currentlyFavorited) {
                    // 如果已收藏，则移除
                    result = TTremoveFromCustomCommonNodes(node.type);
                } else {
                    // 如果未收藏，则添加
                    result = TTaddToCustomCommonNodes(node.type, node.title);
                }
                
                // 显示反馈
                const originalText = this.textContent;
                const originalColor = this.style.color;
                const originalBorderColor = this.style.borderColor;
                
                this.textContent = result.success ? '✓' : '✗';
                this.style.color = result.success ? '#4CAF50' : '#f44336';
                this.style.borderColor = result.success ? '#4CAF50' : '#f44336';
                
                setTimeout(() => {
                    // 更新按钮状态
                    const nowFavorited = TTcustomCommonNodes.some(customNode => customNode.type === node.type);
                    this.textContent = nowFavorited ? '★' : '⭐';
                    this.title = nowFavorited ? '已收藏' : '添加到常用节点';
                    this.style.color = nowFavorited ? '#FFD700' : '#999';
                    this.style.borderColor = nowFavorited ? '#FFD700' : '#666';
                }, 1000);
                
                console.log('TT Favorite operation result:', result.message);
            });
            
            item.appendChild(addButton);
            
            // 悬停效果
            item.addEventListener('mouseenter', function() {
                this.style.background = '#444';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });
            
            // 点击创建节点
            item.addEventListener('click', function(e) {
                if (e.target === addButton) return;
                
                console.log('TT Creating node from search:', node.type);
                TTcreateNodeFromType(node.type);
                
                // 关闭菜单
                if (document.body.contains(menu)) {
                    menu.remove();
                }
            });
            
            container.appendChild(item);
        });
    });
}

function TTdisplayCommonNodes(container, menu, event) {
    console.log('=== TT Displaying common nodes ===');
    console.log('TT Current TTcustomCommonNodes:', TTcustomCommonNodes);
    console.log('TT TTcustomCommonNodes length:', TTcustomCommonNodes.length);
    
    container.innerHTML = '';
    
    // 显示自定义常用节点
    if (TTcustomCommonNodes.length > 0) {
        console.log('TT Displaying custom nodes:', TTcustomCommonNodes.length);
        const customTitle = document.createElement('div');
        customTitle.textContent = '⭐ 自定义常用';
        customTitle.style.cssText = `
            padding: 8px 16px;
            background: #333;
            color: #fff;
            font-weight: bold;
            border-bottom: 1px solid #555;
            font-size: 11px;
        `;
        container.appendChild(customTitle);
        
        TTcustomCommonNodes.forEach(node => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 1px solid #444;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
                font-size: 12px;
            `;
            
            const nodeTitle = document.createElement('span');
            nodeTitle.textContent = node.title;
            nodeTitle.style.cssText = `
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            item.appendChild(nodeTitle);
            
            // 删除按钮
            const removeButton = document.createElement('button');
            removeButton.textContent = '✗';
            removeButton.title = '从常用节点中移除';
            removeButton.style.cssText = `
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 14px;
                padding: 0 4px;
                transition: color 0.2s;
            `;
            
            removeButton.addEventListener('mouseenter', function() {
                this.style.color = '#f44336';
            });
            
            removeButton.addEventListener('mouseleave', function() {
                this.style.color = '#999';
            });
            
            removeButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('TT Removing custom node:', node.type);
                TTremoveFromCustomCommonNodes(node.type);
                
                // 重新渲染菜单
                TTdisplayCommonNodes(container, menu, event);
            });
            
            item.appendChild(removeButton);
            
            // 悬停效果
            item.addEventListener('mouseenter', function() {
                this.style.background = '#444';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });
            
            // 点击创建节点
            item.addEventListener('click', function(e) {
                if (e.target === removeButton) return;
                
                console.log('TT Creating custom common node:', node.type);
                TTcreateNodeFromType(node.type);
                
                // 关闭菜单
                if (document.body.contains(menu)) {
                    menu.remove();
                }
            });
            
            container.appendChild(item);
        });
    } else {
        console.log('TT No custom nodes to display');
    }
    
    // 显示预设常用节点
    console.log('TT Displaying preset nodes');
    const categories = {};
    TTCOMMON_NODES.forEach(node => {
        if (!categories[node.category]) {
            categories[node.category] = [];
        }
        categories[node.category].push(node);
    });
    
    Object.entries(categories).forEach(([category, nodes]) => {
        const categoryTitle = document.createElement('div');
        categoryTitle.textContent = `📁 ${category}`;
        categoryTitle.style.cssText = `
            padding: 8px 16px;
            background: #333;
            color: #fff;
            font-weight: bold;
            border-bottom: 1px solid #555;
            font-size: 11px;
        `;
        container.appendChild(categoryTitle);
        
        nodes.forEach(node => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                border-bottom: 1px solid #444;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
                font-size: 12px;
            `;
            
            const nodeTitle = document.createElement('span');
            nodeTitle.textContent = node.title;
            nodeTitle.style.cssText = `
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            item.appendChild(nodeTitle);
            
            // 添加星星按钮
            const addButton = document.createElement('button');
            const isAlreadyFavorited = TTcustomCommonNodes.some(customNode => customNode.type === node.type);
            addButton.textContent = isAlreadyFavorited ? '★' : '⭐';
            addButton.title = isAlreadyFavorited ? '已收藏' : '添加到常用节点';
            addButton.style.cssText = `
                background: none;
                border: 1px solid ${isAlreadyFavorited ? '#FFD700' : '#666'};
                color: ${isAlreadyFavorited ? '#FFD700' : '#999'};
                cursor: pointer;
                font-size: 12px;
                padding: 2px 6px;
                border-radius: 3px;
                transition: all 0.2s;
                margin-left: 8px;
            `;
            
            addButton.addEventListener('mouseenter', function() {
                if (!TTcustomCommonNodes.some(customNode => customNode.type === node.type)) {
                    this.style.color = '#FFD700';
                    this.style.borderColor = '#FFD700';
                }
            });
            
            addButton.addEventListener('mouseleave', function() {
                const nowFavorited = TTcustomCommonNodes.some(customNode => customNode.type === node.type);
                if (!nowFavorited) {
                    this.style.color = '#999';
                    this.style.borderColor = '#666';
                }
            });
            
            addButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // 动态检查当前收藏状态
                const currentlyFavorited = TTcustomCommonNodes.some(customNode => customNode.type === node.type);
                
                let result;
                if (currentlyFavorited) {
                    // 如果已收藏，则移除
                    result = TTremoveFromCustomCommonNodes(node.type);
                } else {
                    // 如果未收藏，则添加
                    result = TTaddToCustomCommonNodes(node.type, node.title);
                }
                
                // 显示反馈
                this.textContent = result.success ? '✓' : '✗';
                this.style.color = result.success ? '#4CAF50' : '#f44336';
                this.style.borderColor = result.success ? '#4CAF50' : '#f44336';
                
                setTimeout(() => {
                    // 更新按钮状态
                    const nowFavorited = TTcustomCommonNodes.some(customNode => customNode.type === node.type);
                    this.textContent = nowFavorited ? '★' : '⭐';
                    this.title = nowFavorited ? '已收藏' : '添加到常用节点';
                    this.style.color = nowFavorited ? '#FFD700' : '#999';
                    this.style.borderColor = nowFavorited ? '#FFD700' : '#666';
                }, 1000);
                
                console.log('TT Favorite operation result:', result.message);
            });
            
            item.appendChild(addButton);
            
            item.addEventListener('mouseenter', function() {
                this.style.background = '#444';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });
            
            item.addEventListener('click', function(e) {
                if (e.target === addButton) return;
                
                console.log('TT Creating common node:', node.type);
                TTcreateNodeFromType(node.type);
                
                // 关闭菜单
                if (document.body.contains(menu)) {
                    menu.remove();
                }
            });
            
            container.appendChild(item);
        });
    });
}

function TTaddToHistory(nodeType, nodeTitle) {
    // 检查是否已存在
    const existingIndex = TTnodeHistory.findIndex(item => item.type === nodeType);
    
    if (existingIndex !== -1) {
        // 如果存在，更新使用次数和时间，移到最前面
        const existing = TTnodeHistory[existingIndex];
        existing.count = (existing.count || 1) + 1;
        existing.lastUsed = Date.now();
        
        // 移到数组开头
        TTnodeHistory.splice(existingIndex, 1);
        TTnodeHistory.unshift(existing);
    } else {
        // 如果不存在，添加新项目
        const newItem = {
            type: nodeType,
            title: nodeTitle || nodeType,
            count: 1,
            lastUsed: Date.now()
        };
        
        TTnodeHistory.unshift(newItem);
    }
    
    // 限制历史记录数量
    if (TTnodeHistory.length > TTMAX_HISTORY) {
        TTnodeHistory = TTnodeHistory.slice(0, TTMAX_HISTORY);
    }
    
    // 保存到localStorage
    TTsaveHistory();
}

// 鼠标坐标跟踪
function TTsetupMouseTracking() {
    console.log('TT Setting up mouse tracking');
    
    // 跟踪鼠标移动
    document.addEventListener('mousemove', function(e) {
        TTlastMousePosition.x = e.clientX;
        TTlastMousePosition.y = e.clientY;
    });
    
    // 跟踪右键点击
    document.addEventListener('contextmenu', function(e) {
        TTlastMousePosition.x = e.clientX;
        TTlastMousePosition.y = e.clientY;
    });
    
    // 跟踪普通点击
    document.addEventListener('click', function(e) {
        TTlastMousePosition.x = e.clientX;
        TTlastMousePosition.y = e.clientY;
    });
    
    console.log('TT Mouse tracking setup complete');
}

function TTcreateNodeFromType(nodeType) {
    console.log('TT Creating node:', nodeType);
    
    try {
        // 计算节点创建位置
        let nodePos = [TTlastMousePosition.x, TTlastMousePosition.y];
        
        // 如果有canvas，转换坐标到图形空间
        if (window.app && window.app.canvas) {
            const canvas = window.app.canvas;
            if (canvas.ds && canvas.ds.scale) {
                // 考虑缩放和偏移
                nodePos[0] = (TTlastMousePosition.x - canvas.ds.offset[0]) / canvas.ds.scale;
                nodePos[1] = (TTlastMousePosition.y - canvas.ds.offset[1]) / canvas.ds.scale;
            }
        }
        
        console.log('TT Node position calculated:', nodePos);
        
        // 使用ComfyUI的正确方法创建节点
        if (window.app && window.app.canvas && window.app.canvas.graph) {
            const canvas = window.app.canvas;
            const graph = canvas.graph;
            
            // 方法1: 使用LiteGraph的createNode方法
            let node = null;
            if (graph.createNode) {
                node = graph.createNode(nodeType);
                console.log('TT Created node using graph.createNode:', node);
            }
            
            // 方法2: 如果方法1失败，尝试使用LiteGraph全局方法
            if (!node && window.LiteGraph && window.LiteGraph.createNode) {
                node = window.LiteGraph.createNode(nodeType);
                console.log('TT Created node using LiteGraph.createNode:', node);
                
                // 手动添加到图中
                if (node && graph.add) {
                    graph.add(node);
                }
            }
            
            // 方法3: 使用ComfyUI的addNodeOnGraph方法（如果存在）
            if (!node && window.app.addNodeOnGraph) {
                node = window.app.addNodeOnGraph(nodeType, { pos: nodePos });
                console.log('TT Created node using app.addNodeOnGraph:', node);
            }
            
            // 方法4: 尝试直接实例化节点类
            if (!node && window.LiteGraph && window.LiteGraph.registered_node_types) {
                const NodeClass = window.LiteGraph.registered_node_types[nodeType];
                if (NodeClass) {
                    node = new NodeClass();
                    node.type = nodeType;
                    node.pos = nodePos;
                    if (graph.add) {
                        graph.add(node);
                    }
                    console.log('TT Created node using direct instantiation:', node);
                }
            }
            
            if (node) {
                // 设置节点位置到鼠标点击位置
                node.pos = nodePos;
                console.log('TT Set node position to:', nodePos);
                
                // 确保节点在图中
                if (!node.graph && graph.add) {
                    graph.add(node);
                }
                
                // 设置节点大小（如果需要）
                if (node.computeSize) {
                    node.computeSize();
                }
                
                // 刷新画布
                if (canvas.setDirty) {
                    canvas.setDirty(true, true);
                }
                
                // 重绘画布
                if (canvas.draw) {
                    canvas.draw(true, true);
                }
                
                console.log('TT Node created and added successfully:', nodeType, node);
                
                // 添加到历史记录
                TTaddToHistory(nodeType, nodeType);
                
                return node;
            } else {
                console.error('TT Failed to create node:', nodeType);
                console.log('TT Available node types:', window.LiteGraph ? Object.keys(window.LiteGraph.registered_node_types || {}) : 'LiteGraph not available');
                console.log('TT Available methods:', {
                    'graph.createNode': graph.createNode ? 'available' : 'not available',
                    'LiteGraph.createNode': window.LiteGraph && window.LiteGraph.createNode ? 'available' : 'not available',
                    'app.addNodeOnGraph': window.app.addNodeOnGraph ? 'available' : 'not available',
                    'registered_node_types': window.LiteGraph && window.LiteGraph.registered_node_types ? Object.keys(window.LiteGraph.registered_node_types).length + ' types' : 'not available'
                });
            }
        } else {
            console.error('TT ComfyUI canvas or graph not available');
            console.log('TT Available objects:', {
                'window.app': window.app ? 'available' : 'not available',
                'window.app.canvas': window.app && window.app.canvas ? 'available' : 'not available',
                'window.app.canvas.graph': window.app && window.app.canvas && window.app.canvas.graph ? 'available' : 'not available'
            });
        }
    } catch (error) {
        console.error('TT Error creating node:', error);
    }
    
    return null;
}

function TTshowHistoryMenu(event) {
    console.log('TT Showing history menu');
    
    // 移除已存在的菜单
    const existingMenu = document.getElementById('tt-node-history-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // 创建菜单容器
    const menu = document.createElement('div');
    menu.id = 'tt-node-history-menu';
    menu.style.cssText = `
        position: fixed;
        top: ${event.clientY || TTbuttonPosition.y + 50}px;
        left: ${event.clientX || TTbuttonPosition.x}px;
        background: #2a2a2a;
        border: 1px solid #555;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 250px;
        max-height: 400px;
        overflow-y: auto;
        font-family: Arial, sans-serif;
        font-size: 12px;
    `;
    
    // 添加标题
    const title = document.createElement('div');
    title.textContent = '📋 TT节点搜索';
    title.style.cssText = `
        padding: 8px 16px;
        background: #333;
        color: white;
        font-weight: bold;
        border-bottom: 1px solid #555;
        border-radius: 6px 6px 0 0;
    `;
    menu.appendChild(title);
    
    // 添加搜索框
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
        padding: 8px 16px;
        background: #2a2a2a;
        border-bottom: 1px solid #555;
    `;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索节点...';
    searchInput.style.cssText = `
        width: 100%;
        padding: 6px 8px;
        background: #444;
        border: 1px solid #666;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        outline: none;
    `;
    
    searchContainer.appendChild(searchInput);
    menu.appendChild(searchContainer);
    
    // 搜索结果容器
    const searchResults = document.createElement('div');
    searchResults.id = 'tt-search-results';
    searchResults.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
    `;
    menu.appendChild(searchResults);
    
    // 搜索功能
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim();
            TTdisplaySearchResults(query, searchResults, menu, event);
        }, 300);
    });
    
    // 自动聚焦搜索框
    setTimeout(() => {
        searchInput.focus();
    }, 100);
    
    // 初始显示常用节点
    TTdisplayCommonNodes(searchResults, menu, event);
    
    // 添加到页面
    document.body.appendChild(menu);
    
    // 点击外部关闭菜单
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                document.removeEventListener('click', closeMenu);
                if (document.body.contains(menu)) {
                    menu.remove();
                }
            }
        });
    }, 100);
}

// 创建可拖拽按钮
function TTcreateButton() {
    console.log('TT Creating draggable button');
    
    // 检查按钮是否已存在
    const existingButton = document.getElementById('tt-common-nodes-btn');
    if (existingButton) {
        console.log('TT Button already exists, removing old one');
        existingButton.remove();
    }
    
    // 加载按钮位置
    TTloadButtonPosition();
    
    // 创建按钮
    const button = document.createElement('div');
    button.id = 'tt-common-nodes-btn';
    button.textContent = '🥔';
    button.title = 'TT常用节点 (可拖拽)';
    
    button.style.cssText = `
        position: fixed !important;
        top: ${TTbuttonPosition.y}px !important;
        left: ${TTbuttonPosition.x}px !important;
        width: 40px !important;
        height: 40px !important;
        background: linear-gradient(135deg, #4CAF50, #45a049) !important;
        color: white !important;
        border: none !important;
        border-radius: 50% !important;
        cursor: move !important;
        z-index: 9999 !important;
        font-size: 16px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        transition: all 0.2s ease !important;
        user-select: none !important;
        font-family: Arial, sans-serif !important;
    `;
    
    // 拖拽功能变量
    let TTisDragging = false;
    let TTdragOffset = { x: 0, y: 0 };
    let TTdragStartTime = 0;
    
    // 鼠标按下事件
    button.addEventListener('mousedown', function(e) {
        TTisDragging = true;
        TTdragStartTime = Date.now();
        TTdragOffset.x = e.clientX - TTbuttonPosition.x;
        TTdragOffset.y = e.clientY - TTbuttonPosition.y;
        
        button.style.transform = 'scale(0.95)';
        button.style.cursor = 'grabbing';
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    // 鼠标移动事件
    document.addEventListener('mousemove', function(e) {
        if (TTisDragging) {
            TTbuttonPosition.x = e.clientX - TTdragOffset.x;
            TTbuttonPosition.y = e.clientY - TTdragOffset.y;
            
            // 限制按钮在屏幕范围内
            TTbuttonPosition.x = Math.max(0, Math.min(window.innerWidth - 40, TTbuttonPosition.x));
            TTbuttonPosition.y = Math.max(0, Math.min(window.innerHeight - 40, TTbuttonPosition.y));
            
            button.style.left = TTbuttonPosition.x + 'px';
            button.style.top = TTbuttonPosition.y + 'px';
        }
    });
    
    // 鼠标释放事件
    document.addEventListener('mouseup', function(e) {
        if (TTisDragging) {
            TTisDragging = false;
            button.style.transform = 'scale(1)';
            button.style.cursor = 'move';
            
            // 保存位置
            TTsaveButtonPosition();
            
            // 如果拖拽时间很短，视为点击
            const dragDuration = Date.now() - TTdragStartTime;
            if (dragDuration < 200) {
                setTimeout(() => {
                    TTshowHistoryMenu(e);
                }, 50);
            }
        }
    });
    
    // 悬停效果
    button.addEventListener('mouseenter', function() {
        if (!TTisDragging) {
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        }
    });
    
    button.addEventListener('mouseleave', function() {
        if (!TTisDragging) {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }
    });
    
    // 右键菜单事件
    button.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        TTshowHistoryMenu(e);
    });
    
    // 强制添加到body
    document.body.appendChild(button);
    console.log('TT Draggable button added to body at position:', TTbuttonPosition);
    
    // 验证按钮是否真的添加了
    setTimeout(() => {
        const checkButton = document.getElementById('tt-common-nodes-btn');
        if (checkButton) {
            console.log('✅ TT Draggable button successfully created and found in DOM');
            console.log('TT Button position:', checkButton.getBoundingClientRect());
        } else {
            console.error('❌ TT Button not found in DOM after creation');
        }
    }, 100);
}

// 监听节点创建
function TTsetupNodeListener() {
    console.log('TT Setting up node creation listener');
    
    // 监听节点创建事件
    if (window.app && window.app.graph) {
        const originalAdd = window.app.graph.add;
        window.app.graph.add = function(node) {
            const result = originalAdd.call(this, node);
            
            // 记录节点创建
            if (node && node.type) {
                console.log('TT Node added:', node.type);
                TTaddToHistory(node.type, node.title || node.type);
            }
            
            return result;
        };
        
        console.log('TT Node listener setup complete');
    } else {
        console.warn('TT Cannot setup node listener - app.graph not available');
        
        // 延迟重试
        setTimeout(() => {
            if (window.app && window.app.graph) {
                TTsetupNodeListener();
            }
        }, 1000);
    }
}

// 初始化插件
function TTinitPlugin() {
    console.log('=== TT NodeHistory plugin initializing ===');
    
    // 首先检查localStorage是否可用
    try {
        localStorage.setItem('TTtest', 'test');
        localStorage.removeItem('TTtest');
        console.log('TT localStorage is available');
    } catch (error) {
        console.error('TT localStorage is not available:', error);
    }
    
    // 加载历史记录和按钮位置
    TTloadHistory();
    TTloadButtonPosition();
    
    // 重点：加载自定义常用节点
    console.log('TT About to load custom common nodes...');
    TTloadCustomCommonNodes();
    console.log('TT After loading, TTcustomCommonNodes contains:', TTcustomCommonNodes);
    
    // 设置鼠标坐标跟踪
    TTsetupMouseTracking();
    
    // 设置节点监听
    TTsetupNodeListener();
    
    // 创建按钮
    TTcreateButton();
    
    console.log('=== TT NodeHistory plugin initialized ===');
    console.log('TT Final plugin state - TTcustomCommonNodes:', TTcustomCommonNodes);
}

// 强制创建按钮的多种方式
function TTforceCreateButton() {
    console.log('=== TT Force creating button ===');
    
    // 方法1: 立即创建
    TTcreateButton();
    
    // 方法2: DOM加载完成后创建
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', TTcreateButton);
    }
    
    // 方法3: 页面完全加载后创建
    window.addEventListener('load', TTcreateButton);
    
    // 方法4: 延迟创建
    setTimeout(TTcreateButton, 500);
    setTimeout(TTcreateButton, 1000);
    setTimeout(TTcreateButton, 2000);
    setTimeout(TTcreateButton, 3000);
}

// 注册扩展
window.app?.registerExtension({
    name: "ComfyUI.TTNodeHistory",
    async setup() {
        console.log('=== TT Extension setup called ===');
        
        // 立即尝试初始化
        TTinitPlugin();
        
        // 强制创建按钮
        TTforceCreateButton();
        
        console.log('=== TT Extension setup complete ===');
    }
});

// 如果app还没有加载，等待加载完成
if (!window.app) {
    console.log('TT Waiting for ComfyUI app to load...');
    const TTcheckApp = setInterval(() => {
        if (window.app) {
            console.log('TT ComfyUI app loaded, registering extension');
            clearInterval(TTcheckApp);
            window.app.registerExtension({
                name: "ComfyUI.TTNodeHistory",
                async setup() {
                    console.log('=== TT Extension setup called (delayed) ===');
                    
                    // 立即尝试初始化
                    TTinitPlugin();
                    
                    // 强制创建按钮
                    TTforceCreateButton();
                    
                    console.log('=== TT Extension setup complete (delayed) ===');
                }
            });
        }
    }, 100);
}

console.log('=== TT NodeHistory extension registered ===');

// 额外的全局检查
setTimeout(() => {
    console.log('=== TT Final check ===');
    const button = document.getElementById('tt-common-nodes-btn');
    if (button) {
        console.log('✅ TT Button found in final check');
    } else {
        console.error('❌ TT Button still not found, creating one more time');
        TTcreateButton();
    }
}, 5000);