export default (isEdit) => {
  let eventFormContent = (isEdit) ?
      `<a href="#" class="button button--gray" data-cancel>Отмена</a>
      <div class="event-form__delete-btn">
          <button class="button button--gray" id="deleteEventPopupTrigger">Удалить встречу</button>
      </div>
      <button class="button button--blue">Сохранить</button>`
    : `<a href="#" class="button button--gray" data-cancel>Отмена</a>
      <button class="button button--blue button--disabled">Создать встречу</button>`;

  return  eventFormContent;
}
