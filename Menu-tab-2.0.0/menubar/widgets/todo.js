/**
 * Widget Lista de Tareas (To-Do)
 */
import { storageSet, storageGet } from '../core/utils.js';

export class TodoWidget {
    constructor(container) {
        this.container = container;
        this.todos = [];
        this.STORAGE_KEY = 'widget_todos';

        this.init();
    }

    async init() {
        const stored = await storageGet([this.STORAGE_KEY]);
        this.todos = stored[this.STORAGE_KEY] || [];
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="widget-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                Tareas
            </div>
            <div class="todo-input-container">
                <input type="text" class="todo-input" placeholder="Nueva tarea...">
                <button class="todo-add-btn">+</button>
            </div>
            <ul class="todo-list"></ul>
        `;

        this.renderTodos();
        this.bindEvents();
    }

    renderTodos() {
        const list = this.container.querySelector('.todo-list');
        list.innerHTML = '';

        if (this.todos.length === 0) {
            list.innerHTML = '<li style="text-align:center; opacity:0.6; font-size:0.8rem; padding:10px;">No hay tareas pendientes</li>';
            return;
        }

        this.todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
                <span class="todo-text">${todo.text}</span>
                <button class="todo-delete" data-index="${index}">×</button>
            `;
            list.appendChild(li);
        });
    }

    bindEvents() {
        const input = this.container.querySelector('.todo-input');
        const addBtn = this.container.querySelector('.todo-add-btn');
        const list = this.container.querySelector('.todo-list');

        const addTodo = () => {
            const text = input.value.trim();
            if (text) {
                this.todos.push({ text, completed: false });
                this.save();
                this.renderTodos();
                input.value = '';
            }
        };

        addBtn.addEventListener('click', addTodo);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo();
        });

        list.addEventListener('click', (e) => {
            if (e.target.classList.contains('todo-checkbox')) {
                const index = e.target.dataset.index;
                this.todos[index].completed = e.target.checked;
                this.save();
                this.renderTodos();
            } else if (e.target.classList.contains('todo-delete')) {
                const index = e.target.dataset.index;
                this.todos.splice(index, 1);
                this.save();
                this.renderTodos();
            }
        });
    }

    async save() {
        await storageSet({ [this.STORAGE_KEY]: this.todos });
    }
}
