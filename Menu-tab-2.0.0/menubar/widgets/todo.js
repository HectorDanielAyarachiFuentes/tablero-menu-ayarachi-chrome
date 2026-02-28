/**
 * Widget Lista de Tareas (To-Do) — Pro Edition
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
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                Tareas
                <span class="todo-counter" id="todo-counter"></span>
            </div>
            <div class="todo-input-row">
                <input type="text" class="todo-input" id="todo-input-field" placeholder="Añadir nueva tarea..." maxlength="120" autocomplete="off">
                <button class="todo-add-btn" id="todo-add-btn" title="Agregar tarea">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
            <ul class="todo-list" id="todo-list"></ul>
        `;

        this.renderTodos();
        this.bindEvents();
    }

    renderTodos() {
        const list = this.container.querySelector('#todo-list');
        list.innerHTML = '';

        const pending = this.todos.filter(t => !t.completed).length;
        const counter = this.container.querySelector('#todo-counter');
        if (counter) {
            counter.textContent = pending > 0 ? pending : '';
        }

        if (this.todos.length === 0) {
            list.innerHTML = `
                <li class="todo-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12l3 3 5-5"></path></svg>
                    <span>¡Sin tareas pendientes!</span>
                </li>`;
            return;
        }

        // Pendientes primero, completadas al final
        const sorted = [...this.todos.map((t, i) => ({ ...t, _orig: i }))]
            .sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));

        sorted.forEach(({ _orig: index, text, completed }) => {
            const li = document.createElement('li');
            li.className = `todo-item${completed ? ' completed' : ''}`;
            li.innerHTML = `
                <label class="todo-checkbox-label">
                    <input type="checkbox" class="todo-checkbox" ${completed ? 'checked' : ''} data-index="${index}">
                    <span class="todo-checkmark">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                </label>
                <span class="todo-text">${this.escapeHtml(text)}</span>
                <button class="todo-delete" data-index="${index}" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;
            list.appendChild(li);
        });
    }

    bindEvents() {
        const input = this.container.querySelector('#todo-input-field');
        const addBtn = this.container.querySelector('#todo-add-btn');
        const list = this.container.querySelector('#todo-list');

        const addTodo = (e) => {
            if (e) e.stopPropagation();
            const text = input.value.trim();
            if (!text) {
                input.classList.add('todo-input-shake');
                setTimeout(() => input.classList.remove('todo-input-shake'), 400);
                input.focus();
                return;
            }
            this.todos.push({ text, completed: false });
            this.save();
            this.renderTodos();
            input.value = '';
            input.focus();
        };

        addBtn.addEventListener('click', addTodo);
        addBtn.addEventListener('mousedown', e => e.stopPropagation());

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTodo(e);
        });
        input.addEventListener('click', e => e.stopPropagation());
        input.addEventListener('mousedown', e => e.stopPropagation());

        list.addEventListener('click', (e) => {
            e.stopPropagation();
            const checkbox = e.target.closest('.todo-checkbox');
            const deleteBtn = e.target.closest('.todo-delete');

            if (checkbox) {
                const index = parseInt(checkbox.dataset.index);
                this.todos[index].completed = checkbox.checked;
                this.save();
                this.renderTodos();
            } else if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index);
                const item = deleteBtn.closest('.todo-item');
                item.classList.add('todo-item-removing');
                setTimeout(() => {
                    this.todos.splice(index, 1);
                    this.save();
                    this.renderTodos();
                }, 250);
            }
        });
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    async save() {
        await storageSet({ [this.STORAGE_KEY]: this.todos });
    }
}
