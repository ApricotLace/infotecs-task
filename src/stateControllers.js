import render from './render';
import { chunk } from './utils';


// App Workflow:
// State changes (By controllers)
// |
// V
// Controller calls paginate with updated DATA and STATE
// |
// V
// Paginate splits data by chunks and sets to STATE
// |
// V
// Paginate calls render with new STATE (or not, if passed DATA length equals to 0)
//

// Paginate - main controller, prepares data for pagination and calls render.
export const paginate = (data, calledBy, state) => {
  if (!data.length) {
    render(state.currentData, calledBy, !!data.length, state);
    return;
  }
  state.pages = chunk(data, 10); // Splits data by equal chunks, i.e pages
  state.currentData = state.pages[state.currentPage]; // Sets a specific page as a current data
  render(state.currentData, calledBy, true, state); // Render table with passed data
};

// Handler for event listener. (click event on button element (buttons inside pageSelectorsDiv))
// Update state.currentPage value.
export const changePage = (state, index) => {
  state.currentPage = index;
  // The data has not changed in any way(only current page),
  // so the dechunked version of data is thrown as the first argument
  paginate(state.pages.flat(), 'changePage', state);
};

// Iterate thru data coll,
// Filter callback get object values, flat them, glue them in a single string(exclude img value),
// checks if this string contains the given keyword, return boolean
const keywordFilter = (keyword, data) => data
  .filter((val) => {
    const flattedObject = Object
      .entries(val)
      .map(([, value]) => (typeof value === 'object'
        ? Object.values(value)
        : value));

    const stringifiedObject = flattedObject
      .slice(0, flattedObject.length - 1)
      .join(' ');
    return stringifiedObject.includes(keyword);
  });

// Handler for event listener. (submit event on input element (filter button))
// Updates state, calls keywordFilter function, update infoEl value.
export const filter = (event, state) => {
  event.preventDefault();
  state.currentPage = 0;
  state.keyword = document.getElementById('filter-input').value;
  if (!state.keyword) {
    paginate(state.initialState, 'filterDataLenIsNull', state);
    return;
  }
  const currentData = state.pages.flat();
  const filteredData = keywordFilter(state.keyword, currentData);
  paginate(filteredData, 'overall', state);
  document.getElementById('info').textContent = `Filtered by keyword: [${state.keyword}]\nFound ${filteredData.length} records. (Filtered ${currentData.length} records.)`;
};

// Iterate thru data coll,
// Filter callback checks if a particular column(KEY) contains a keyword (in value), return boolean
// columnName format - [key] or [key, key]
// (nameObj is nested in mainObj, so we need 2 keys, to get first or last name)
const keywordFilterByColumn = (keyword, data, columnName) => data
  .filter((val) => {
    if (columnName.length === 2) {
      return val[columnName[0]][columnName[1]].includes(keyword);
    }

    if (columnName[0] === 'memo') {
      return val[columnName[0]].join(' ').includes(keyword);
    }
    return val[columnName[0]].includes(keyword);
  });

// Handler for event listener. (submit event on input element (filterByColumn button))
// Updates state, calls keywordFilterByColumn function, update infoEl value.
export const columnFilter = (event, state) => {
  event.preventDefault();
  state.currentPage = 0;
  state.colKeyword = document.getElementById('filter-by-column-input').value;
  if (!state.colKeyword) {
    return;
  }
  const currentData = state.pages.flat();
  state.columnName = document.getElementById('select-column').value;
  const filteredData = keywordFilterByColumn(state.colKeyword, currentData, state.columnName.split('-'));
  paginate(filteredData, 'column', state);
  document.getElementById('info').textContent = `Filtered by keyword: [${state.colKeyword}] in column: ${state.columnName}\nFound ${filteredData.length} records (Filtered ${currentData.length} records.)`;
};

// Handlers for evenet listeners. (click event on img element (crossed eye icon))
// controllers group changes state.visibilityFilters value
// state.visibilityFilter affects quantity of rendered columns

export const showColumn = (state, key) => {
  state.visibilityFilters = { ...state.visibilityFilters, [key]: true };
  paginate(state.pages.flat(), 'showColumn', state);
};

export const hideColumn = (state, normalizedHeaderName) => {
  state.visibilityFilters = { ...state.visibilityFilters, [normalizedHeaderName]: false };
  paginate(state.pages.flat(), 'hideColumn', state);
};

// Handler for event listener. (click event on submit button in editor)
// Initializes a new object (updatedRow),
// receiving data from input elements of a modal window.
// Creates a new data collection (based on state.pages.flat())
// where a specific index is replaced with a previously created updatedRow object.
// Calls paginate function with updated data.
const updateRow = (event, state, relativeIndex) => {
  event.preventDefault();
  const updatedRow = {
    id: document.getElementById('editor-id').value,
    name: {
      first: document.getElementById('editor-first').value,
      last: document.getElementById('editor-last').value,
    },
    email: document.getElementById('editor-email').value,
    gender: document.getElementById('editor-gender').value,
    memo: document.getElementById('editor-memo').value.split('\n'),
    img: document.getElementById('editor-img').src,
  };
  const allRows = state.pages.flat();
  // immutable array update
  const updatedData = [...allRows.slice(0, relativeIndex), updatedRow, ...allRows.slice(relativeIndex + 1)];
  // hide modal window
  document.getElementsByClassName('modal-container')[0].classList.add('hidden');
  paginate(updatedData, 'updatedRow', state);
};

// Handler for event listener. (click event on tr element)
// Shows a modal window (editor),
// input elements in modal window are initialized with values of a specific table row
// add listener to submit button (updateRow)
export const openEditor = (state, index) => {
  document.body.scrollTop = 0;
  const relativeIndex = state.currentPage * 10 + index;
  const pickedRow = state.pages.flat()[relativeIndex]; // get specific row;

  document.getElementById('editor-id').value = pickedRow.id;
  document.getElementById('editor-first').value = pickedRow.name.first;
  document.getElementById('editor-last').value = pickedRow.name.last;
  document.getElementById('editor-email').value = pickedRow.email;
  document.getElementById('editor-gender').value = pickedRow.gender;
  document.getElementById('editor-memo').value = pickedRow.memo.join('\n');
  document.getElementById('editor-img').setAttribute('src', pickedRow.img);

  document.getElementById('row-editor')
    .addEventListener('submit', event => updateRow(event, state, relativeIndex), { once: true });

  document.getElementsByClassName('modal-container')[0]
    .classList
    .remove('hidden');
};

// Handler for event listener. (click event on button element)
// Reset everything to initial state
export const reset = (event, state) => {
  event.preventDefault();
  state.currentPage = 0;
  state.keyword = '';
  state.colKeyword = '';
  document.getElementById('info').textContent = '';
  document.getElementById('filter-input').value = '';
  document.getElementById('filter-by-column-input').value = '';
  paginate(state.initialState, 'reset', state);
};

// Handler for event listener. (click event on div element)
// Close modal window.
export const close = () => {
  document
    .getElementsByClassName('modal-container')[0]
    .classList
    .add('hidden');
};
