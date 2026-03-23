// Глобальная переменная для хранения экземпляров Sortable
let sortableInstances = [];

// Ждем полной загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена');
    
    // Загружаем задачи
    loadTasks();
    
    // Настраиваем форму создания задачи
    setupCreateTaskForm();
    
    // Настраиваем модальное окно
    setupModal();
    
    // Инициализируем Drag & Drop
    initSortable();
});

// Функция загрузки задач с сервера
function loadTasks() {
    console.log('Загружаем задачи...');
    
    fetch('/api/tasks')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки задач');
            }
            return response.json();
        })
        .then(tasks => {
            console.log('Получено задач:', tasks.length);
            displayTasks(tasks);
        })
        .catch(error => {
            console.error('Ошибка при загрузке:', error);
            alert('Не удалось загрузить задачи');
        });
}

// Функция отображения задач по колонкам
function displayTasks(tasks) {
    // Получаем контейнеры колонок
    const newTasksContainer = document.getElementById('new-tasks');
    const inProgressTasksContainer = document.getElementById('in-progress-tasks');
    const doneTasksContainer = document.getElementById('done-tasks');
    
    // Очищаем все колонки
    newTasksContainer.innerHTML = '';
    inProgressTasksContainer.innerHTML = '';
    doneTasksContainer.innerHTML = '';
    
    // Если задач нет, показываем сообщение
    if (tasks.length === 0) {
        showEmptyMessage(newTasksContainer, 'Нет задач');
        showEmptyMessage(inProgressTasksContainer, 'Нет задач');
        showEmptyMessage(doneTasksContainer, 'Нет задач');
        return;
    }
    
    // Распределяем задачи по колонкам
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        
        switch(task.status) {
            case 'new':
                newTasksContainer.appendChild(taskElement);
                break;
            case 'in_progress':
                inProgressTasksContainer.appendChild(taskElement);
                break;
            case 'done':
                doneTasksContainer.appendChild(taskElement);
                break;
            default:
                console.warn('Неизвестный статус:', task.status);
        }
    });
}

// Функция создания HTML элемента задачи
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task';
    div.setAttribute('data-id', task.id);
    
    // Создаем заголовок задачи
    const titleDiv = document.createElement('div');
    titleDiv.className = 'task-title';
    titleDiv.textContent = task.title;
    
    div.appendChild(titleDiv);
    
    // Если есть описание, добавляем превью
    if (task.description && task.description.trim() !== '') {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'task-preview';
        // Показываем первые 50 символов описания
        const preview = task.description.length > 50 
            ? task.description.substring(0, 50) + '...' 
            : task.description;
        previewDiv.textContent = preview;
        div.appendChild(previewDiv);
    }
    
    // Добавляем обработчик клика для открытия модального окна
    div.addEventListener('click', function(e) {
        // Предотвращаем срабатывание при перетаскивании
        if (!sortableInstances.some(s => s.option('dragging'))) {
            e.stopPropagation();
            openTaskModal(task);
        }
    });
    
    return div;
}

// Функция открытия модального окна с описанием задачи
function openTaskModal(task) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    
    modalTitle.textContent = task.title;
    
    if (task.description && task.description.trim() !== '') {
        modalDescription.textContent = task.description;
    } else {
        modalDescription.textContent = 'Нет описания';
        modalDescription.style.color = '#999';
        modalDescription.style.fontStyle = 'italic';
    }
    
    modal.style.display = 'block';
}

// Настройка модального окна
function setupModal() {
    const modal = document.getElementById('task-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    // Закрытие по крестику
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Закрытие по клику вне модального окна
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

// Функция отображения сообщения о пустой колонке
function showEmptyMessage(container, message) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-message';
    emptyDiv.textContent = message;
    container.appendChild(emptyDiv);
}

// Настройка формы создания задачи
function setupCreateTaskForm() {
    const createForm = document.getElementById('create-task-form');
    
    if (!createForm) {
        console.error('Форма создания не найдена');
        return;
    }
    
    createForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Отменяем отправку формы
        
        const titleInput = document.getElementById('new-task-title');
        const descriptionTextarea = document.getElementById('new-task-description');
        const title = titleInput.value.trim();
        const description = descriptionTextarea.value.trim();
        
        if (!title) {
            alert('Введите название задачи');
            return;
        }
        
        createTask(title, description);
        titleInput.value = ''; // Очищаем поле ввода
        descriptionTextarea.value = ''; // Очищаем описание
    });
}

// Функция создания новой задачи
function createTask(title, description) {
    console.log('Создаем задачу:', title);
    
    fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            title: title,
            description: description 
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка создания задачи');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Задача создана успешно');
            loadTasks(); // Перезагружаем список задач
        } else {
            throw new Error('Сервер вернул ошибку');
        }
    })
    .catch(error => {
        console.error('Ошибка при создании:', error);
        alert('Не удалось создать задачу');
    });
}

// Инициализация Drag & Drop (SortableJS)
function initSortable() {
    // Находим все контейнеры с задачами
    const taskLists = document.querySelectorAll('.task-list');
    
    if (taskLists.length === 0) {
        console.error('Контейнеры для задач не найдены');
        return;
    }
    
    console.log('Инициализация Sortable для', taskLists.length, 'колонок');
    
    // Очищаем предыдущие экземпляры, если есть
    sortableInstances.forEach(instance => instance.destroy());
    sortableInstances = [];
    
    // Создаем новые экземпляры Sortable для каждой колонки
    taskLists.forEach(list => {
        const sortable = new Sortable(list, {
            group: {
                name: 'tasks',      // Общая группа для всех колонок
                pull: true,          // Можно забирать задачи из других колонок
                revertClone: false,  // Не оставлять клон
                sort: true           // Можно сортировать внутри колонки
            },
            animation: 150,          // Длительность анимации
            handle: '.task',         // За что можно перетаскивать
            draggable: '.task',      // Какие элементы можно перетаскивать
            onEnd: function(event) {
                // Событие после окончания перетаскивания
                const taskElement = event.item;
                const taskId = taskElement.getAttribute('data-id');
                const newContainer = event.to;
                const newContainerId = newContainer.id;
                
                console.log('Задача перемещена:', taskId, 'в колонку:', newContainerId);
                
                // Определяем новый статус по ID контейнера
                let newStatus;
                switch(newContainerId) {
                    case 'new-tasks':
                        newStatus = 'new';
                        break;
                    case 'in-progress-tasks':
                        newStatus = 'in_progress';
                        break;
                    case 'done-tasks':
                        newStatus = 'done';
                        break;
                    default:
                        console.error('Неизвестный контейнер:', newContainerId);
                        return;
                }
                
                // Отправляем запрос на обновление статуса
                updateTaskStatus(taskId, newStatus);
            }
        });
        
        sortableInstances.push(sortable);
    });
}

// Функция обновления статуса задачи
function updateTaskStatus(taskId, newStatus) {
    console.log('Обновляем статус задачи', taskId, 'на', newStatus);
    
    fetch('/api/tasks/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: parseInt(taskId),
            status: newStatus
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка обновления статуса');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Статус задачи обновлен успешно');
        } else {
            throw new Error('Сервер вернул ошибку');
        }
    })
    .catch(error => {
        console.error('Ошибка при обновлении:', error);
        alert('Не удалось обновить статус задачи');
        loadTasks(); // Перезагружаем все задачи для восстановления состояния
    });
}