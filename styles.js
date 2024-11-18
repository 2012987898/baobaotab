window.onload = function () {
    const hot = document.getElementById('hot');
    const tj = document.getElementById('tianjia');
    const popup = document.getElementById('popup');
    const closePopup = document.getElementById('closePopup');
    const completeButton = document.getElementById('completeButton');
    const nameInput = document.getElementById('nameInput');
    const linkInput = document.getElementById('linkInput');
    const fileInput = document.getElementById('fileInput');
    const ssyqPopup = document.getElementById('ssyqPopup');
    const closeSsyq = document.getElementById('closeSsyq');
    const addEnginePopup = document.getElementById('addEnginePopup');
    const closeAddEngine = document.getElementById('closeAddEngine');
    const addEngineBtn = document.getElementById('addEngineBtn');

    // 默认搜索引擎配置
    const defaultEngines = [
        {
            name: '百度',
            icon: '/src/baidu.png',
            engine: 'baidu',
            url: 'https://www.baidu.com/s?wd=%s'
        },
        {
            name: '谷歌',
            icon: '/src/google.png',
            engine: 'google',
            url: 'https://www.google.com/search?q=%s'
        },
        {
            name: '必应',
            icon: '/src/bing.png',
            engine: 'bing',
            url: 'https://www.bing.com/search?q=%s'
        }
    ];

    // 初始化搜索引擎配置
    let searchEngines = {};
    defaultEngines.forEach(engine => {
        searchEngines[engine.engine] = engine.url;
    });

    // 获取保存的当前搜索引擎
    const savedCurrentEngine = localStorage.getItem('currentEngine');
    let currentEngine = savedCurrentEngine ? JSON.parse(savedCurrentEngine).engine : 'baidu';

    // 设置初始搜索引擎图标
    const searchIcon = document.querySelector('.search .ssyq');
    if (savedCurrentEngine) {
        searchIcon.src = JSON.parse(savedCurrentEngine).icon;
    }

    // 绑定搜索引擎事件
    function bindSearchEngineEvents(engineElement) {
        engineElement.addEventListener('click', function() {
            if (!this.classList.contains('edit-mode')) {
                document.querySelectorAll('.ssyq-list .ssyq-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                const engineImg = this.querySelector('img').src;
                searchIcon.src = engineImg;
                currentEngine = this.getAttribute('data-engine');
                
                // 保存当前搜索引擎
                localStorage.setItem('currentEngine', JSON.stringify({
                    engine: currentEngine,
                    icon: engineImg
                }));

                ssyqPopup.classList.remove('show');
                setTimeout(() => {
                    ssyqPopup.style.display = 'none';
                }, 300);
            }
        });

        const deleteBtn = engineElement.querySelector('.ssyq-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const list = this.closest('.ssyq-list');
                if (list.children.length <= 1) {
                    alert('至少保留一个搜索引擎！');
                    return;
                }
                if (engineElement.classList.contains('active')) {
                    const nextActive = list.children[0] === engineElement ? list.children[1] : list.children[0];
                    nextActive.classList.add('active');
                    searchIcon.src = nextActive.querySelector('img').src;
                    currentEngine = nextActive.getAttribute('data-engine');
                    
                    // 保存当前搜索引擎
                    localStorage.setItem('currentEngine', JSON.stringify({
                        engine: currentEngine,
                        icon: nextActive.querySelector('img').src
                    }));
                }
                list.removeChild(engineElement);
                saveSearchEngines();
            });
        }

        // 添加长按事件
        let touchTimer;
        engineElement.addEventListener('touchstart', function(e) {
            touchTimer = setTimeout(() => {
                const deleteButtons = document.querySelectorAll('.ssyq-delete');
                deleteButtons.forEach(btn => {
                    btn.style.display = 'block';
                    btn.parentElement.classList.add('edit-mode');
                });
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 500);
        });

        engineElement.addEventListener('touchend', function() {
            clearTimeout(touchTimer);
        });

        engineElement.addEventListener('touchmove', function() {
            clearTimeout(touchTimer);
        });
    }

    // 保存搜索引擎配置
    function saveSearchEngines() {
        const enginesList = document.querySelectorAll('.ssyq-list .ssyq-item');
        const engines = Array.from(enginesList).map(item => ({
            name: item.querySelector('span:not(.ssyq-delete)').textContent,
            icon: item.querySelector('img').src,
            engine: item.getAttribute('data-engine'),
            url: searchEngines[item.getAttribute('data-engine')]
        }));
        localStorage.setItem('searchEngines', JSON.stringify(engines));
    }

    // 加载搜索引擎列表
    function loadSearchEngines() {
        const savedEngines = localStorage.getItem('searchEngines');
        const list = document.querySelector('.ssyq-list');
        list.innerHTML = '';

        const engines = savedEngines ? JSON.parse(savedEngines) : defaultEngines;
        engines.forEach(engine => {
            searchEngines[engine.engine] = engine.url;
            
            const li = document.createElement('li');
            li.className = 'ssyq-item' + (engine.engine === currentEngine ? ' active' : '');
            li.setAttribute('data-engine', engine.engine);
            li.innerHTML = `
                <img src="${engine.icon}" alt="${engine.name}">
                <span>${engine.name}</span>
                <span class="ssyq-delete">×</span>
            `;
            
            bindSearchEngineEvents(li);
            list.appendChild(li);
        });
    }

    // 初始化加载
    loadSearchEngines();

    // 搜索相关功能
    const searchInput = document.querySelector('.search input');
    const searchButton = document.querySelector('.search .shou');
    const clearButton = document.querySelector('.search .cha');

    // 输入框内容变化时检查是否显示清空按钮
    searchInput.addEventListener('input', function() {
        if (this.value) {
            clearButton.classList.add('show');
        } else {
            clearButton.classList.remove('show');
        }
    });

    // 页面加载时检查输入框是否有内容
    window.addEventListener('DOMContentLoaded', function() {
        if (searchInput.value) {
            clearButton.classList.add('show');
        }
    });

    // 点击清空按钮时清空输入框
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        this.classList.remove('show');
        searchInput.focus(); // 保持输入框焦点
    });

    // 搜索功能
    function performSearch() {
        const searchText = searchInput.value.trim();
        if (searchText) {
            const engineUrl = searchEngines[currentEngine];
            if (engineUrl) {
                addToHistory(searchText);
                const searchUrl = engineUrl.replace('%s', encodeURIComponent(searchText));
                window.open(searchUrl, '_blank');
                // 保清空按钮的显示状态
                clearButton.classList.add('show');
            }
        }
    }

    // 搜索按钮点击事件
    searchButton.addEventListener('click', performSearch);

    // 回车搜索
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // 搜索引擎选择弹窗
    const ssyqButton = document.querySelector('.ssyq');
    ssyqButton.addEventListener('click', function() {
        ssyqPopup.style.display = 'block';
        ssyqPopup.classList.add('show');
    });

    closeSsyq.addEventListener('click', function() {
        ssyqPopup.classList.remove('show');
        setTimeout(() => {
            ssyqPopup.style.display = 'none';
        }, 300);
    });

    // 添加搜索引擎弹窗
    document.querySelector('.add-engine-btn').addEventListener('click', function() {
        ssyqPopup.classList.remove('show');
        setTimeout(() => {
            ssyqPopup.style.display = 'none';
            addEnginePopup.style.display = 'block';
            addEnginePopup.classList.add('show');
        }, 300);
    });

    // 点击弹窗外关闭
    ssyqPopup.addEventListener('click', function(e) {
        if (e.target === ssyqPopup) {
            closeSsyq.click();
        }
    });

    addEnginePopup.addEventListener('click', function(e) {
        if (e.target === addEnginePopup) {
            closeAddEngine.click();
        }
    });

    // 标签页相关功能
    if (hot) {
        // 默认标签页数据
        const defaultHotButtons = [
            { name: '抖音', image: '/src/dy.jpg', link: 'https://www.douyin.com' },
            { name: '哔哩哩', image: '/src/blbl.png', link: 'https://www.bilibili.com' },
            { name: 'chatgpt', image: '/src/chatgpt.png', link: 'https://chatgpt.com' }
        ];

        // 标签页存储相关功能
        function saveHotButtons() {
            const buttons = document.querySelectorAll('#hot button:not(#tianjia)');
            const hotData = Array.from(buttons).map(button => ({
                name: button.getAttribute('data-name'),
                image: button.querySelector('img').src,
                link: button.getAttribute('data-link')
            }));
            localStorage.setItem('hotButtons', JSON.stringify(hotData));
        }

        // 加载保存的标签页
        function loadHotButtons() {
            const savedButtons = localStorage.getItem('hotButtons');
            // 清除现有的按钮（除了添加按钮）
            const existingButtons = hot.querySelectorAll('button:not(#tianjia)');
            existingButtons.forEach(button => button.remove());

            const buttons = savedButtons ? JSON.parse(savedButtons) : defaultHotButtons;
            buttons.forEach(item => {
                createButton(item.name, item.image, item.link);
            });
        }

        // 创建按钮函数
        function createButton(name, image, link) {
            // 创建外层容器
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            // 创建按钮
            const button = document.createElement('button');
            button.setAttribute('data-name', name);
            button.setAttribute('data-link', link);

            const img = document.createElement('img');
            img.src = image;
            img.classList.add('tb');

            // 创建删除按钮
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'san';
            deleteBtn.innerText = 'x';

            // 组装结构
            button.appendChild(img);
            buttonContainer.appendChild(button);
            buttonContainer.appendChild(deleteBtn);
            hot.insertBefore(buttonContainer, tj);

            // 删除按钮事件
            deleteBtn.addEventListener('click', function(event) {
                event.stopPropagation();
                buttonContainer.remove();
                saveHotButtons();
            });

            // PC端显示删除按钮
            buttonContainer.addEventListener('mouseenter', function() {
                if (!isDragging) {
                    deleteBtn.style.display = 'flex';
                }
            });

            buttonContainer.addEventListener('mouseleave', function() {
                if (!buttonContainer.classList.contains('edit-mode')) {
                    deleteBtn.style.display = 'none';
                }
            });

            // 点击按钮跳转
            button.addEventListener('click', function() {
                if (!isDragging) {
                    window.open(link, '_blank');
                }
            });

            // 拖拽相关变量
            let isDragging = false;
            let startX, startY;
            let draggedContainer = null;
            let placeholder = null;
            let originalIndex = -1;
            let lastX, lastY;
            let animationFrame;
            let touchTimer;

            // 开始拖拽
            function startDrag(element, clientX, clientY) {
                isDragging = true;
                draggedContainer = element;
                const rect = element.getBoundingClientRect();
                startX = clientX - rect.left;
                startY = clientY - rect.top;
                lastX = clientX;
                lastY = clientY;

                // 创建占位元素
                placeholder = element.cloneNode(true);
                placeholder.style.opacity = '0.3';
                placeholder.style.pointerEvents = 'none';
                placeholder.classList.add('placeholder');

                // 设置拖动元素样式
                element.style.position = 'fixed';
                element.style.zIndex = '1000';
                element.style.width = rect.width + 'px';
                element.style.height = rect.height + 'px';
                element.style.transition = 'none';
                element.classList.add('dragging');

                // 记录原始位置
                originalIndex = Array.from(hot.children).indexOf(element);

                // 插入占位符
                element.parentNode.insertBefore(placeholder, element);
            }

            // 更新拖拽位置
            function updateDragPosition(clientX, clientY) {
                cancelAnimationFrame(animationFrame);
                animationFrame = requestAnimationFrame(() => {
                    const left = clientX - startX;
                    const top = clientY - startY;
                    draggedContainer.style.transform = `translate(${left}px, ${top}px)`;

                    const containers = Array.from(hot.querySelectorAll('.button-container:not(.dragging)'));
                    const containerRects = containers.map(btn => btn.getBoundingClientRect());
                    
                    let closestIndex = -1;
                    let minDistance = Infinity;
                    
                    containerRects.forEach((rect, index) => {
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        const distance = Math.hypot(
                            clientX - centerX,
                            clientY - centerY
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = index;
                        }
                    });

                    if (closestIndex !== -1 && containers[closestIndex] !== placeholder) {
                        const targetContainer = containers[closestIndex];
                        const targetIndex = Array.from(hot.children).indexOf(targetContainer);
                        
                        if (targetIndex < originalIndex) {
                            targetContainer.parentNode.insertBefore(placeholder, targetContainer);
                        } else {
                            targetContainer.parentNode.insertBefore(placeholder, targetContainer.nextSibling);
                        }
                        originalIndex = Array.from(hot.children).indexOf(placeholder);
                    }
                });
            }

            // 结束拖拽
            function endDrag() {
                if (!isDragging) return;
                
                cancelAnimationFrame(animationFrame);
                
                draggedContainer.style.position = '';
                draggedContainer.style.zIndex = '';
                draggedContainer.style.width = '';
                draggedContainer.style.height = '';
                draggedContainer.style.transform = '';
                draggedContainer.style.transition = '';
                draggedContainer.classList.remove('dragging');

                if (placeholder && placeholder.parentNode) {
                    placeholder.parentNode.replaceChild(draggedContainer, placeholder);
                    saveHotButtons();
                }

                isDragging = false;
                draggedContainer = null;
                placeholder = null;
            }

            // PC端拖拽
            button.addEventListener('mousedown', function(e) {
                if (e.button !== 0) return;
                startDrag(buttonContainer, e.clientX, e.clientY);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            function onMouseMove(e) {
                if (!isDragging) return;
                e.preventDefault();
                updateDragPosition(e.clientX, e.clientY);
            }

            function onMouseUp() {
                endDrag();
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            // 移动端长按和拖拽
            button.addEventListener('touchstart', function(e) {
                touchTimer = setTimeout(() => {
                    const touch = e.touches[0];
                    startDrag(buttonContainer, touch.clientX, touch.clientY);
                    
                    document.querySelectorAll('.button-container .san').forEach(btn => {
                        btn.style.display = 'flex';
                        btn.parentElement.classList.add('edit-mode');
                    });
                    
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }, 500);
            });

            button.addEventListener('touchmove', function(e) {
                if (!isDragging) {
                    clearTimeout(touchTimer);
                    return;
                }
                e.preventDefault();
                const touch = e.touches[0];
                updateDragPosition(touch.clientX, touch.clientY);
            });

            button.addEventListener('touchend', function() {
                clearTimeout(touchTimer);
                endDrag();
            });
        }

        // 初始加载标签页
        loadHotButtons();

        // 添加签页弹窗
        tj.addEventListener('click', function() {
            popup.style.display = 'block';
            popup.classList.remove('hide');
            popup.classList.add('show');
        });

        // 关闭弹窗
        closePopup.addEventListener('click', function() {
            popup.classList.remove('show');
            popup.classList.add('hide');
            setTimeout(() => {
                popup.style.display = 'none';
                nameInput.value = '';
                linkInput.value = '';
                fileInput.value = '';
                // 清除预览图片
                const previewImage = document.getElementById('previewImage');
                if (previewImage) {
                    previewImage.remove();
                }
            }, 300);
        });

        // 点击弹窗外部关闭
        popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                closePopup.click();
            }
        });

        // 添加新标签页
        completeButton.addEventListener('click', function() {
            const name = nameInput.value.trim();
            const link = linkInput.value.trim();
            const file = fileInput.files[0];

            if (!name || !link || !file) {
                alert('请填写完整信息');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                createButton(name, e.target.result, link);
                saveHotButtons();
                closePopup.click();
            };

            reader.readAsDataURL(file);
        });

        // 点击hot区域的空白处显示删除按钮
        hot.addEventListener('click', function(e) {
            // 检查是否点击的是空白区域
            if (e.target === hot) {
                enterEditMode();
            }
        });

        // 长按hot区域的空白处显示删除按钮
        let hotTouchTimer;
        hot.addEventListener('touchstart', function(e) {
            if (e.target === hot) {
                hotTouchTimer = setTimeout(() => {
                    enterEditMode();
                    // 添加震动反馈
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }, 500);
            }
        });

        hot.addEventListener('touchend', function() {
            clearTimeout(hotTouchTimer);
        });

        hot.addEventListener('touchmove', function() {
            clearTimeout(hotTouchTimer);
        });

        // 进入编辑模式的函数
        function enterEditMode() {
            document.querySelectorAll('.button-container').forEach(container => {
                container.classList.add('edit-mode');
                const deleteBtn = container.querySelector('.san');
                if (deleteBtn) {
                    deleteBtn.style.display = 'flex';
                }
                // 添加颤抖动画
                container.querySelector('button').classList.add('shake');
            });
        }

        // 退出编辑模式的函数
        function exitEditMode() {
            document.querySelectorAll('.button-container').forEach(container => {
                container.classList.remove('edit-mode');
                const deleteBtn = container.querySelector('.san');
                if (deleteBtn) {
                    deleteBtn.style.display = 'none';
                }
                // 移除颤抖动画
                container.querySelector('button').classList.remove('shake');
            });
        }

        // 点击其他区域退出编辑模式
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.button-container') && 
                !e.target.closest('.san') && 
                e.target !== hot) {
                exitEditMode();
            }
        });

        // 滑动时退出编辑模式
        document.addEventListener('touchmove', function() {
            exitEditMode();
        });
    }

    // 搜索历史功能
    let searchHistoryArray = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const searchHistory = document.querySelector('.search-history');
    const historyList = document.querySelector('.history-list');
    const clearHistoryBtn = document.querySelector('.clear-history');

    function showSearchHistory() {
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (searchHistoryArray.length > 0) {
            searchHistory.style.display = 'block';
            
            searchHistoryArray.forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';
                li.innerHTML = `
                    <div class="history-content">
                        <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <path d="M512 74.666667C270.933333 74.666667 74.666667 270.933333 74.666667 512S270.933333 949.333333 512 949.333333 949.333333 753.066667 949.333333 512 753.066667 74.666667 512 74.666667z m0 810.666666c-204.8 0-373.333333-168.533333-373.333333-373.333333S307.2 138.666667 512 138.666667 885.333333 307.2 885.333333 512 716.8 885.333333 512 885.333333z" fill="#666666"></path>
                            <path d="M512 512c-17.066667 0-32 14.933333-32 32v192c0 17.066667 14.933333 32 32 32s32-14.933333 32-32v-192c0-17.066667-14.933333-32-32-32zM512 288c-17.066667 0-32 14.933333-32 32v14.933333c0 17.066667 14.933333 32 32 32s32-14.933333 32-32V320c0-17.066667-14.933333-32-32-32z" fill="#666666"></path>
                        </svg>
                        <span>${item}</span>
                    </div>
                    <span class="history-delete">×</span>
                `;

                // 点击历史记录内容
                const historyContent = li.querySelector('.history-content');
                historyContent.addEventListener('click', () => {
                    searchInput.value = item;
                    searchInput.focus();
                    searchHistory.style.display = 'none';
                    clearButton.classList.add('show');
                });

                // 点击删除按钮
                const deleteBtn = li.querySelector('.history-delete');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    searchHistoryArray = searchHistoryArray.filter(history => history !== item);
                    localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArray));
                    showSearchHistory();
                    if (searchHistoryArray.length === 0) {
                        searchHistory.style.display = 'none';
                    }
                });

                historyList.appendChild(li);
            });
        } else {
            searchHistory.style.display = 'none';
        }
    }

    function addToHistory(searchText) {
        searchHistoryArray = searchHistoryArray.filter(item => item !== searchText);
        searchHistoryArray.unshift(searchText);
        if (searchHistoryArray.length > 10) {
            searchHistoryArray.pop();
        }
        localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArray));
        showSearchHistory();
    }

    clearHistoryBtn.addEventListener('click', () => {
        searchHistoryArray = [];
        localStorage.removeItem('searchHistory');
        showSearchHistory();
        searchHistory.style.display = 'none';
    });

    searchInput.addEventListener('focus', () => {
        if (searchHistoryArray.length > 0) {
            searchHistory.style.display = 'block';
            showSearchHistory();
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && 
            !searchHistory.contains(e.target) && 
            !e.target.closest('.history-item')) {
            searchHistory.style.display = 'none';
        }
    });

    // 修改添加搜索引擎相关代码
    addEngineBtn.addEventListener('click', function() {
        const name = document.getElementById('engineName').value.trim();
        const url = document.getElementById('engineUrl').value.trim();
        const iconFile = document.getElementById('engineIcon').files[0];

        if (!name || !url || !iconFile) {
            alert('请填写完整信息');
            return;
        }

        if (!url.includes('%s')) {
            alert('搜索链接必须包含 %s 作为搜索词占位');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const engineId = name.toLowerCase().replace(/\s+/g, '_');
            
            // 添加到搜索引擎配置
            searchEngines[engineId] = url;
            
            // 创建新的搜索引擎项
            const li = document.createElement('li');
            li.className = 'ssyq-item';
            li.setAttribute('data-engine', engineId);
            li.innerHTML = `
                <img src="${e.target.result}" alt="${name}">
                <span>${name}</span>
                <span class="ssyq-delete">×</span>
            `;
            
            // 绑定事件
            bindSearchEngineEvents(li);
            
            // 添加到列表
            document.querySelector('.ssyq-list').appendChild(li);
            
            // 保存更改
            saveSearchEngines();
            
            // 关闭弹窗
            closeAddEngine.click();
            
            // 显示搜索引擎选弹窗
            setTimeout(() => {
                ssyqPopup.style.display = 'block';
                ssyqPopup.classList.add('show');
            }, 300);
        };

        reader.readAsDataURL(iconFile);
    });

    // 修改关闭添加搜索引擎弹窗的代码
    closeAddEngine.addEventListener('click', function() {
        addEnginePopup.classList.remove('show');
        addEnginePopup.classList.add('hide');
        setTimeout(() => {
            addEnginePopup.style.display = 'none';
            addEnginePopup.classList.remove('hide');
            // 清空输入和预览图片
            document.getElementById('engineName').value = '';
            document.getElementById('engineUrl').value = '';
            document.getElementById('engineIcon').value = '';
            const previewImage = document.getElementById('previewImage');
            if (previewImage) {
                previewImage.remove();
            }
        }, 300);
    });

    // 文件选择预览功能
    document.getElementById('engineIcon').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // 移除已存在的预览图片
                const existingPreview = document.getElementById('previewImage');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                // 创建新的预览图片
                const img = document.createElement('img');
                img.id = 'previewImage';
                img.src = e.target.result;
                img.style.cssText = `
                    width: 100px;
                    height: 100px;
                    object-fit: contain;
                    margin: 10px auto;
                    display: block;
                    border-radius: 8px;
                `;
                
                // 添加到弹窗内容区域
                const urlTip = document.querySelector('.url-tip');
                urlTip.parentNode.insertBefore(img, urlTip.nextSibling);
            };
            reader.readAsDataURL(file);
        }
    });

    // 标签页片预览功能
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // 移除已存在的预览图片
                const existingPreview = document.getElementById('previewImage');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                // 创建新的预览图片
                const img = document.createElement('img');
                img.id = 'previewImage';
                img.src = e.target.result;
                img.style.cssText = `
                    width: 100px;
                    height: 100px;
                    object-fit: contain;
                    margin: 10px auto;
                    display: block;
                    border-radius: 50%; /* 使用圆形，与标签页样式一致 */
                `;
                
                // 添加到弹窗内容区域
                const fileInput = document.getElementById('fileInput');
                fileInput.parentNode.insertBefore(img, fileInput.nextSibling);
            };
            reader.readAsDataURL(file);
        }
    });

    // 长按搜索引擎项目显示删除按钮（移动端）
    document.querySelectorAll('.ssyq-item').forEach(item => {
        let touchTimer;
        
        // 长按开始
        item.addEventListener('touchstart', function(e) {
            touchTimer = setTimeout(() => {
                const deleteButtons = document.querySelectorAll('.ssyq-delete');
                deleteButtons.forEach(btn => {
                    btn.style.display = 'block';
                    btn.parentElement.classList.add('edit-mode');
                });
                // 添加震动效果
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 500); // 500ms长按时间
        });
        
        // 触摸结束或移动时清除定时器
        item.addEventListener('touchend', function() {
            clearTimeout(touchTimer);
        });
        
        item.addEventListener('touchmove', function() {
            clearTimeout(touchTimer);
        });
    });

    // 点击页面其他区域退出编辑模式
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.ssyq-item') && !e.target.closest('.ssyq-delete')) {
            document.querySelectorAll('.ssyq-item').forEach(item => {
                item.classList.remove('edit-mode');
            });
            document.querySelectorAll('.ssyq-delete').forEach(btn => {
                btn.style.display = 'none';
            });
        }
    });

    // 添加点击页面其他区域退出编辑模式的功
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.hot > button') && !e.target.closest('.san')) {
            document.querySelectorAll('.hot > button').forEach(button => {
                button.classList.remove('edit-mode');
                const deleteBtn = button.querySelector('.san');
                if (deleteBtn) {
                    deleteBtn.style.display = 'none';
                }
            });
        }
    });

    // 添加移动端滑动时退出编辑模式
    document.addEventListener('touchmove', function() {
        document.querySelectorAll('.hot > button').forEach(button => {
            button.classList.remove('edit-mode');
            const deleteBtn = button.querySelector('.san');
            if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }
        });
    });
};

