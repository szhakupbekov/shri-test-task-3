import field from './field'
import getUser from './getUser'
import getUserTag from './getUserTag'
import hideOnClickOutside from './../../tools/hideOnClickOutside';
import {getNodeFromMarkup} from './../../tools/helpers';

const getAutocompleteMarkup = (fieldProps) => {
  return `<div class="field-autocomplete" data-autocomplete>
            ${field(fieldProps)}
            
            <i class="field-autocomplete__arrow">
              <svg width="12" height="12">
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-arrow"></use>
              </svg>
            </i>
            
            <div class="field-autocomplete__dropdown"></div>
            <div class="field-autocomplete__tags"></div>
          </div>`;
};

const dropdownItemHandler = (event, item, container) => {
  const dropdownItem = item;
  const userId = dropdownItem.getAttribute('data-user-id');
  const user = dropdownItem.querySelector('.user');
  const login = user.getAttribute('data-login');
  const avatarUrl = user.querySelector('img').getAttribute('src');
  const userArrInContainer = container.querySelectorAll('.user-tag');
  let userTag = getUserTag(userId, login, avatarUrl);

  for (let userIn of Array.from(userArrInContainer)) {
   const userInId = userIn.getAttribute('data-user-id');

   if (userInId === userId) {
     return false;
   }
  }
  console.log(user);

  container.appendChild(userTag);
};

const autocompleteHandler = (event, inputUsers) => {
  const input = event.target;
  const autocomplete = input.parents('[data-autocomplete]')[0];
  const autocompleteDropdown = autocomplete.querySelector('.field-autocomplete__dropdown');
  const autocompleteTagsContainer = autocomplete.querySelector('.field-autocomplete__tags');
  const clearAutocomplete = () => {
    autocomplete.classList.remove('opened');
    autocompleteDropdown.innerHTML = '';
  };
  let inputValue = input.value;
  let autocompleteList,
    autocompleteListItems = '',
    autocompleteListItem,
    autocompleteDropdownItemArr;

  if (inputValue.length < 2) {
    clearAutocomplete();
    return false;
  }

  // console.log(autocomplete);

  for (let user of Array.from(inputUsers)) {
    const login = user.login;

    if (login.indexOf(inputValue) !== -1) {
      autocompleteListItem = `<li class="field-autocomplete__dropdown-item" data-user-id="${user.id}" data-autocomplete-item>
                                  ${getUser(login, user.avatarUrl)}
                                  &nbsp;·&nbsp;${user.homeFloor} этаж
                              </li>`;

      autocompleteListItems += autocompleteListItem;
    }
  }

  if (autocompleteListItems.length === 0) {
      return false;
  }

  autocompleteList = `<ul>${autocompleteListItems}</ul>`;
  autocompleteDropdown.innerHTML = autocompleteList;
  autocomplete.classList.add('opened');

  autocompleteDropdownItemArr = autocompleteDropdown.querySelectorAll('.field-autocomplete__dropdown-item');

  let getDropdownItemHandler,
    dropdownItemRemoveClickListener;
  for (let autocompleteDropdownItem of Array.from(autocompleteDropdownItemArr)) {
    getDropdownItemHandler = (event) =>  {
      dropdownItemHandler(event, autocompleteDropdownItem, autocompleteTagsContainer);
      clearAutocomplete();
      dropdownItemRemoveClickListener();
    };

    dropdownItemRemoveClickListener = () => {
      autocompleteDropdownItem.removeEventListener('click', getDropdownItemHandler);
    };

    autocompleteDropdownItem.addEventListener('click', getDropdownItemHandler);
  }



  hideOnClickOutside('[data-autocomplete]', () => {
    clearAutocomplete();
    dropdownItemRemoveClickListener();
  });
};

export {getAutocompleteMarkup, autocompleteHandler};
