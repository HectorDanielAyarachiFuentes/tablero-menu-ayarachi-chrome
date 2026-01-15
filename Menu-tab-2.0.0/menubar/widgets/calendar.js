/**
 * Widget Calendario Simple
 */
export class CalendarWidget {
    constructor(container) {
        this.container = container;
        this.currentDate = new Date();
        this.render();
    }

    render() {
        const monthYear = this.currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

        this.container.innerHTML = `
            <div class="widget-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Calendario
            </div>
            <div class="calendar-control">
                <button class="calendar-nav-btn prev">‹</button>
                <span class="calendar-month-name" style="text-transform: capitalize;">${monthYear}</span>
                <button class="calendar-nav-btn next">›</button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-header-day">Do</div>
                <div class="calendar-header-day">Lu</div>
                <div class="calendar-header-day">Ma</div>
                <div class="calendar-header-day">Mi</div>
                <div class="calendar-header-day">Ju</div>
                <div class="calendar-header-day">Vi</div>
                <div class="calendar-header-day">Sa</div>
            </div>
        `;

        this.generateDays();
        this.bindEvents();
    }

    generateDays() {
        const grid = this.container.querySelector('.calendar-grid');
        // Mantener headers
        const headers = Array.from(grid.children).slice(0, 7);
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Días vacíos previos
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const el = document.createElement('div');
            el.className = 'calendar-day';
            el.textContent = day;

            if (year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate()) {
                el.classList.add('today');
            }

            grid.appendChild(el);
        }
    }

    bindEvents() {
        this.container.querySelector('.prev').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        this.container.querySelector('.next').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
    }
}
