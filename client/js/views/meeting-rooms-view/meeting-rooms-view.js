import AbstractView from './../abstract-view';
import Application from './../../application';
import {calendarMarkup, openCalendar} from './calendar';
import RenderCalendarWidget from './renderCalendarWidget';
import {debounce, getDateValue} from '../../tools/helpers';
import activateRoomName from './activateRoomName';
import RenderEvents from './renderEvents';

let globalTimeout;

class MeetingRoomsView extends AbstractView {

  constructor(inputData) {
    super(inputData);
    this.rooms = inputData.rooms;
    this.date = inputData.date || new Date();
    this.year = this.date.getFullYear();
    this.month = this.date.getMonth();
    this.day = this.date.getDate();
    this.hour = this.date.getHours();
    this.minute = this.date.getMinutes();
    this.dayMin = 8;
    this.dayMax = 22;
    this.dayTotal = this.dayMax - this.dayMin + 1;
    this.initialAppDate = new Date();
    this.initialAppDay = getDateValue(this.initialAppDate).day;
    this.dateValue = getDateValue(this.date).day;
    this.IS_INPUT_DATE_EQUAL_INITIAL_APP_DATE = this.dateValue === this.initialAppDay;
    this.IS_PAST = this.dateValue < this.initialAppDay;
    this.events = inputData.events[this.dateValue] || [];
  }

  diagramCellMarkup(cellMarkup, time) {
    const cell = (cellMarkup !== undefined ) ? cellMarkup : '';
    const dataTime = `${time !== undefined ? 'data-time=' + time : ''}`;
    return `<div class="diagram__cell" ${dataTime}>${cell}</div>`;
  }

  getCellList(inputMarkup) {
    let cellList = '';
    for (let time = this.dayMin; time <= this.dayMax; time++) {
      cellList += this.diagramCellMarkup(inputMarkup, time)
    }
    return cellList;
  }

  diagramTimeMarkup(time, isNow, isCurrentTime) {
    const now = isNow ? ' diagram__time--now' : '';
    const minute = this.minute < 10 ? `0${this.minute}` : this.minute;
    const currentTime = `${this.hour}:${minute}`;
    return `<span class="diagram__time${now}">${isCurrentTime !== undefined ? currentTime : time}</span>`;
  }

  diagramTimelineTimeMarkup() {
    const diagramTimeMarkup = this.diagramTimeMarkup(false, true, true);
    let diagramDayMarkup = '';
    for (let time = this.dayMin; time <= this.dayMax; time++) {
      diagramDayMarkup += this.diagramCellMarkup(this.diagramTimeMarkup(time), time);
    }
    return `<div class="diagram__day">${diagramTimeMarkup}${diagramDayMarkup}</div>`;
  }

  updateTime(inputDate) {
    const date = inputDate || new Date();
    this.date = date;
    this.hour = date.getHours();
    this.minute = date.getMinutes();
  }

  renderClockLine() {
    const timeNowEl = this.element.querySelector('.diagram__time--now');
    const dayEl = this.element.querySelector('.diagram__time-line .diagram__day');
    const timelineCellArr = this.element.querySelectorAll('.diagram__time-line .diagram__cell');
    const dayElWidth = getComputedStyle(dayEl).width.slice(0, -2);
    const minuteInSec = 60 * 1000;
    const now = this.date.valueOf();
    const date = new Date(now);
    const dayStart = date.setHours(8, 0, 0);
    const currentMinute = (now - dayStart) / minuteInSec;
    this.minuteStep = dayElWidth / (this.dayTotal * 60);
    const minute = this.minute < 10 ? `0${this.minute}` : this.minute;

    if (this.IS_INPUT_DATE_EQUAL_INITIAL_APP_DATE) {
      timeNowEl.classList.add('show');

      timeNowEl.style.left = `${currentMinute * this.minuteStep}px`;
      timeNowEl.innerHTML = `${this.hour}:${minute}`;

      if (currentMinute < 0 || currentMinute > this.dayTotal * 60) {
        timeNowEl.style.opacity = 0;
      }

      for (let timelineCell of Array.from(timelineCellArr)) {
        const timelineCellValue = timelineCell.getAttribute('data-time');
        if (timelineCellValue <= this.date.getHours()) {
          timelineCell.classList.add('past');
        }
      }
    }
    else if (this.IS_PAST) {
      for (let timelineCell of Array.from(timelineCellArr)) {
        timelineCell.classList.add('past');
      }
    }
  }

  clock(isNewDate) {
    if (isNewDate) {
      this.updateTime();
    } else {
      this.updateTime(this.date);
    }

    this.renderClockLine();

    // Clear all timeouts
    while (globalTimeout--) {
      window.clearTimeout(globalTimeout);
    };

    globalTimeout = setTimeout(() => {
      this.clock(true);
    }, 60000);
  }

  diagramRowMarkup(_diagramSidebarMarkup, _diagramRowBodyMarkup, _rowClass) {
    const rowClass = _rowClass || 'diagram__row';
    const diagramSidebarMarkup = _diagramSidebarMarkup || '';
    const diagramRowBodyMarkup = _diagramRowBodyMarkup || '';
    return `<div class="${rowClass}">
              <div class="diagram__sidebar">${diagramSidebarMarkup}</div>
              <div class="diagram__row-body">${diagramRowBodyMarkup}</div>
            </div>`
  }

  getRoomMarkup(name, capacity) {
    return `<div class="diagram__room-name">${name}</div>
            <div class="diagram__room-capacity">${capacity} человек</div>`;
  }

  getRoomList(floor) {
    let roomList = '';
    const diagramDayTemp = '<div class="diagram__day"></div>'

    for (let room of this.rooms) {
      if (room.floor === floor) {
        const roomMarkup = this.getRoomMarkup(room.title, room.capacity);
        roomList += `<div class="diagram__room" data-room-id="${room.id}">
                        ${this.diagramRowMarkup(roomMarkup, diagramDayTemp)}
                      </div>`;
      }
    }

    return roomList;
  }

  getFloorListMarkup() {
    let floors = [];

    for (let room of this.rooms) {
      if (floors.indexOf(room.floor) === -1) {
        floors.push(room.floor);
      }
    }

    floors.sort((a, b) => {
      if (a > b) return 1;
      if (a < b) return -1;
    });

    let floorList = '';

    for (let floor of floors) {
      floorList += `<div class="diagram__floor" data-floor="${floor}">
                      <div class="diagram__floor-title">
                            ${this.diagramRowMarkup(`${floor} этаж`)}
                      </div>
                      ${this.getRoomList(floor)}
                    </div>`;
    }

    return floorList;
  }

  getMarkup() {
    const header = `<header class="header">
                      <div class="logo"></div>
                      <a href="event-new.html" class="button header__button button--blue" data-event-new-trigger>Создать встречу</a>
                  </header>`;

    const diagram = `<div class="diagram">
                      <div class="diagram__body">
                        <div class="diagram__body-cnt">
                            <div class="diagram__time-line">${this.diagramRowMarkup(calendarMarkup(), this.diagramTimelineTimeMarkup())}</div>
                            <div class="diagram__content-wrapper">
                              <div class="diagram__content">
                                ${this.diagramRowMarkup(null, this.getCellList(), 'diagram__cell-grid')}
                                ${this.getFloorListMarkup()}
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>`;

    return `<div class="inpex-page" id="app">
              ${header} 
              ${diagram}
            </div>`;
  }

  bindHandlers() {
    const eventNewTrigger = this.element.querySelector('[data-event-new-trigger]');

    eventNewTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      alert('times on');
      // Application.showEventCreate();
    });

    const windowResizeHandler = () => {
      this.renderClockLine();
    };

    window.addEventListener('resize', debounce(windowResizeHandler, 66));
  }

  viewRendered() {
    openCalendar();
    activateRoomName();
    const renderCalendarWidget = new RenderCalendarWidget(this.date);
    renderCalendarWidget.render();

    this.clock();

    const renderEvents = new RenderEvents(this.events, this.date, this.minuteStep);
    renderEvents.render();
  }

}

export default MeetingRoomsView;
