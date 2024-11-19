// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 确保 jsPlumb 存在
    if (typeof jsPlumb === 'undefined') {
        // 如果库没有加载，等待一段时间后重试
        setTimeout(() => {
            if (typeof jsPlumb !== 'undefined') {
                initializePlumb();
            } else {
                console.error('jsPlumb 库加载失败');
            }
        }, 1000);
        return;
    }

    // 如果库已加载，直接初始化
    initializePlumb();
});

// 将所有初始化逻辑移到单独的函数中
function initializePlumb() {
    // 初始化 jsPlumb
    const instance = jsPlumb.getInstance({
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        ConnectionOverlays: [
            ['Arrow', {
                location: 1,
                width: 10,
                length: 10
            }]
        ],
        Container: 'graphContainer'
    });

    // 连接点样式
    const connectorPaintStyle = {
        strokeWidth: 2,
        stroke: '#61B7CF',
        joinstyle: 'round',
        outlineStroke: 'transparent',
        outlineWidth: 0
    };

    // 连接点配置
    const connectorHoverStyle = {
        strokeWidth: 3,
        stroke: '#216477',
        outlineWidth: 5,
        outlineStroke: 'white'
    };

    const endpointHoverStyle = {
        fill: '#216477',
        stroke: '#216477'
    };

    const sourceEndpoint = {
        endpoint: 'Dot',
        paintStyle: {
            stroke: '#7AB02C',
            fill: '#7AB02C',
            radius: 4,
            strokeWidth: 1
        },
        isSource: true,
        connector: ['Bezier', { 
            curviness: 50,
            stub: [10, 10],
            gap: 5,
            cornerRadius: 3
        }],
        connectorStyle: {
            strokeWidth: 2,
            stroke: '#61B7CF',
            outlineStroke: 'transparent',
            outlineWidth: 0
        },
        hoverPaintStyle: {
            fill: '#216477',
            stroke: '#216477'
        },
        connectorHoverStyle: {
            strokeWidth: 3,
            stroke: '#216477'
        },
        maxConnections: -1
    };

    const targetEndpoint = {
        endpoint: 'Dot',
        paintStyle: { 
            fill: '#7AB02C',
            radius: 4,
            stroke: '#7AB02C'
        },
        hoverPaintStyle: {
            fill: '#216477',
            stroke: '#216477'
        },
        maxConnections: -1,
        dropOptions: { hoverClass: 'hover', activeClass: 'active' },
        isTarget: true
    };

    let nodeCounter = 0;

    // 添加平移和缩放状态
    let scale = 1;
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let currentTranslate = { x: 0, y: 0 };

    const container = document.getElementById('graphContainer');
    const graphContent = document.createElement('div');
    graphContent.className = 'graph-content';
    graphContent.style.transform = getTransformStyle();
    container.appendChild(graphContent);

    // 获取当前变换样式
    function getTransformStyle() {
        return `translate(${currentTranslate.x}px, ${currentTranslate.y}px) scale(${scale})`;
    }

    // 更新变换
    function updateTransform() {
        graphContent.style.transform = getTransformStyle();
        instance.setZoom(scale);
        instance.repaintEverything();
    }

    // 平移功能
    container.addEventListener('mousedown', function(e) {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // 中键或Alt+左键
            isPanning = true;
            startPoint = {
                x: e.clientX - currentTranslate.x,
                y: e.clientY - currentTranslate.y
            };
            container.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (isPanning) {
            currentTranslate = {
                x: e.clientX - startPoint.x,
                y: e.clientY - startPoint.y
            };
            updateTransform();
        }
    });

    document.addEventListener('mouseup', function() {
        isPanning = false;
        container.style.cursor = 'default';
    });

    // 缩放功能
    container.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const oldScale = scale;

            // 限制缩放范围
            if ((scale > 0.3 && delta < 0) || (scale < 2 && delta > 0)) {
                scale += delta;

                // 计算鼠标位置相对于容器的偏移
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // 调整平移以保持鼠标位置不变
                currentTranslate.x += (x - currentTranslate.x) * (1 - scale/oldScale);
                currentTranslate.y += (y - currentTranslate.y) * (1 - scale/oldScale);

                updateTransform();
            }
        }
    });

    // 修改缩放按钮事件
    document.getElementById('zoomIn').addEventListener('click', function() {
        if (scale < 2) {
            const oldScale = scale;
            scale += 0.1;
            // 以容器中心为基准点进行缩放
            const rect = container.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            currentTranslate.x += (centerX - currentTranslate.x) * (1 - scale/oldScale);
            currentTranslate.y += (centerY - currentTranslate.y) * (1 - scale/oldScale);
            updateTransform();
        }
    });

    document.getElementById('zoomOut').addEventListener('click', function() {
        if (scale > 0.3) {
            const oldScale = scale;
            scale -= 0.1;
            const rect = container.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            currentTranslate.x += (centerX - currentTranslate.x) * (1 - scale/oldScale);
            currentTranslate.y += (centerY - currentTranslate.y) * (1 - scale/oldScale);
            updateTransform();
        }
    });

    // 添加节点函数
    function addNode(type = 'Node', x = 100, y = 100) {
        try {
            nodeCounter++;
            const id = `node${nodeCounter}`;
            const node = document.createElement('div');
            node.id = id;
            node.className = 'node';
            node.innerHTML = type;
            node.style.left = x + 'px';
            node.style.top = y + 'px';
            node.style.position = 'absolute';
            
            const container = document.querySelector('.graph-content');
            if (!container) {
                console.error('找不到容器元素');
                return null;
            }
            
            container.appendChild(node);

            // 使节点可拖动
            instance.draggable(node, {
                drag: function(event) {
                    instance.revalidate(event.el);
                }
            });

            // 添加连接点
            instance.addEndpoint(node, {
                anchor: 'Right',
                uuid: id + '-right'
            }, sourceEndpoint);

            instance.addEndpoint(node, {
                anchor: 'Left',
                uuid: id + '-left'
            }, targetEndpoint);

            // 添加双击编辑功能
            node.addEventListener('dblclick', function() {
                const newText = prompt('输入节点名称:', this.innerHTML);
                if (newText) {
                    this.innerHTML = newText;
                }
            });

            // 添加选择功能
            node.addEventListener('click', function(e) {
                e.stopPropagation();
                document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
                this.classList.add('selected');
            });

            console.log('节点已添加:', id); // 调试信息
            return node;
        } catch (error) {
            console.error('添加节点时出错:', error);
            return null;
        }
    }

    // 添加节点按钮事件
    const addNodeBtn = document.getElementById('addNode');
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', function(e) {
            console.log('添加节点按钮被点击'); // 调试信息
            const type = prompt('请输入节点类型:', 'Node');
            if (type) {
                const container = document.getElementById('graphContainer');
                const scrollLeft = container.scrollLeft || 0;
                const scrollTop = container.scrollTop || 0;
                
                // 在视口中心添加节点
                const x = (container.clientWidth / 2 + scrollLeft - 60) || 100;
                const y = (container.clientHeight / 2 + scrollTop - 25) || 100;
                const newNode = addNode(type, x, y);
                if (newNode) {
                    console.log('节点添加成功');
                } else {
                    console.error('节点添加失败');
                }
            }
        });
    } else {
        console.error('找不到添加节点按钮');
    }

    // 删除选中节点（按Delete键）
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete') {
            const selectedNode = document.querySelector('.node.selected');
            if (selectedNode) {
                instance.remove(selectedNode);
            }
        }
    });

    // 点击空白处取消选择
    document.getElementById('graphContainer').addEventListener('click', function(e) {
        if (e.target === this) {
            document.querySelectorAll('.node').forEach(node => node.classList.remove('selected'));
        }
    });

    // 保存配置
    document.getElementById('saveConfig').addEventListener('click', function() {
        const nodes = Array.from(document.querySelectorAll('.node')).map(node => ({
            id: node.id,
            type: node.innerHTML,
            position: {
                left: parseInt(node.style.left),
                top: parseInt(node.style.top)
            }
        }));

        const connections = instance.getAllConnections().map(conn => ({
            source: conn.sourceId,
            target: conn.targetId
        }));

        const config = { nodes, connections };
        localStorage.setItem('flowchartConfig', JSON.stringify(config));
        alert('配置已保存');
    });

    // 加载配置
    document.getElementById('loadConfig').addEventListener('click', function() {
        const config = JSON.parse(localStorage.getItem('flowchartConfig'));
        if (!config) {
            alert('没有找到保存的配置');
            return;
        }

        // 清空当前图表
        instance.reset();
        document.getElementById('graphContainer').innerHTML = '';
        nodeCounter = 0;

        // 重建节点
        config.nodes.forEach(nodeConfig => {
            const node = addNode(nodeConfig.type, nodeConfig.position.left, nodeConfig.position.top);
            node.id = nodeConfig.id;
        });

        // 重建连接
        config.connections.forEach(conn => {
            instance.connect({
                uuids: [conn.source + '-right', conn.target + '-left']
            });
        });
    });

    // 修改instance的容器为graphContent
    instance.setContainer(graphContent);

    // 添加全局视图功能
    function fitView() {
        const nodes = document.querySelectorAll('.node');
        if (nodes.length === 0) return;

        // 计算所有节点的边界
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        nodes.forEach(node => {
            const rect = node.getBoundingClientRect();
            const nodeLeft = parseInt(node.style.left);
            const nodeTop = parseInt(node.style.top);
            const nodeRight = nodeLeft + rect.width;
            const nodeBottom = nodeTop + rect.height;

            minX = Math.min(minX, nodeLeft);
            minY = Math.min(minY, nodeTop);
            maxX = Math.max(maxX, nodeRight);
            maxY = Math.max(maxY, nodeBottom);
        });

        // 添加边距
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // 计算内容的宽高
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // 获取容器尺寸
        const container = document.getElementById('graphContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // 计算需要的缩放比例
        const scaleX = containerWidth / contentWidth;
        const scaleY = containerHeight / contentHeight;
        scale = Math.min(Math.min(scaleX, scaleY), 1); // 不超过原始大小

        // 计算居中位置
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // 计算平移量使内容居中
        currentTranslate.x = containerWidth / 2 - centerX * scale;
        currentTranslate.y = containerHeight / 2 - centerY * scale;

        // 更新变换
        updateTransform();
    }

    // 添加全局视图按钮事件
    document.getElementById('fitView').addEventListener('click', fitView);
} 