import { removeAllChildren } from './utils';
import {
  changePage, showColumn, hideColumn, openEditor,
} from './stateControllers';

// typesActions - map matching a specific type and its rendering method (process function)
const basicProcessFunc = (value, rowEl, type, state) => {
  if (!state.visibilityFilters[type]) {
    return;
  }
  const tdEl = document.createElement('td');
  tdEl.textContent = value;
  tdEl.classList.add(`${type}`);
  rowEl.appendChild(tdEl);
};

const typesActions = [
  {
    check: type => type === 'id',
    process: basicProcessFunc,
  },
  {
    check: type => type === 'name',
    process: (value, rowEl, _, state) => {
      const tdEl1 = document.createElement('td');
      const tdEl2 = document.createElement('td');
      const { first, last } = value;
      tdEl1.textContent = first;
      tdEl1.classList.add('name-first');
      tdEl2.textContent = last;
      tdEl2.classList.add('name-last');
      if (state.visibilityFilters.firstname) {
        rowEl.appendChild(tdEl1);
      }
      if (state.visibilityFilters.lastname) {
        rowEl.appendChild(tdEl2);
      }
    },
  },
  {
    check: type => type === 'email',
    process: basicProcessFunc,
  },
  {
    check: type => type === 'gender',
    process: basicProcessFunc,
  },
  {
    check: type => type === 'memo',
    process: (value, rowEl, type, state) => {
      if (!state.visibilityFilters[type]) {
        return;
      }
      const tdEl = document.createElement('td');
      tdEl.textContent = value.join('\n');
      tdEl.classList.add(`${type}`);
      rowEl.appendChild(tdEl);
    },
  },
  {
    check: type => type === 'img',
    process: (value, rowEl, type, state) => {
      if (!state.visibilityFilters[type]) {
        return;
      }
      const imgEl = document.createElement('img');
      const tdEl = document.createElement('td');
      imgEl.setAttribute('src', value);
      tdEl.appendChild(imgEl);
      tdEl.classList.add(`${type}`);
      rowEl.appendChild(tdEl);
    },
  },
];

// iterates thru data coll, 'pass' object keys as types to typesActions map.
const renderTableRows = (data, state, mountPoint) => data
  .forEach((row, index) => {
    const trEl = document.createElement('tr');
    trEl.setAttribute('id', index);
    trEl.classList.add('row');
    trEl.addEventListener('click', () => openEditor(state, index));
    Object.entries(row).forEach((el) => {
      const [key, value] = el;
      // get process function by passed type
      const { process } = typesActions.find(({ check }) => check(key));
      // render specific type, ignores hidden columns
      process(value, trEl, key, state);
    });
    mountPoint.appendChild(trEl);
  });

// get collection of td elements, iterates thru them
// wraps passed keyword in span tag
const highlight = (keyword, htmlElements, color) => htmlElements
  .forEach((element) => {
    element.innerHTML = element.textContent.includes(keyword)
      ? element.textContent.split(keyword).join(`<span class="highlighted-${color}">${keyword}</span>`)
      : element.textContent;
  });

// render n page selectors (where n - state.pages.length)
const renderPageSelectors = (state, mountPoint) => {
  // iterate thru page indexes
  const indexes = [...Array(state.pages.length).keys()]; // range() replacement;
  indexes.forEach((index) => {
    const buttonEl = document.createElement('button');
    buttonEl.textContent = index;
    buttonEl.addEventListener('click', () => changePage(state, index));
    mountPoint.appendChild(buttonEl);
  });
};

// render n visibility toggles (where n is a number of currently hidden columns)
const renderVisibilitySelectors = (state, mountPoint) => Object
  .keys(state.visibilityFilters)
  .filter(key => state.visibilityFilters[key] === false)
  .forEach((key) => {
    const buttonEl = document.createElement('button');
    buttonEl.textContent = `show-${key}`;
    buttonEl.addEventListener('click', () => showColumn(state, key));
    mountPoint.appendChild(buttonEl);
  });

// iterates thru tableHeaders array
// and render table headers with visibility toggles, ignores hidden columns
const renderTableHeaders = (state, mountPoint) => {
  const tableHeaders = ['ID', 'FIRST NAME', 'LAST NAME', 'EMAIL', 'GENDER', 'MEMO', 'IMG'];
  const headersRowEl = document.createElement('tr');
  headersRowEl.classList.add('table-headers');
  tableHeaders.forEach((headerName) => {
    // header names must be normalized so that they can be used as object keys
    const normalizedHeaderName = headerName.split(' ').join('').toLowerCase();
    if (!state.visibilityFilters[normalizedHeaderName]) { // is column hidden ?
      return;
    }

    // visibility toggle
    const iconEl = document.createElement('img');
    iconEl.setAttribute('src', 'crossedEye.png');
    iconEl.setAttribute('width', '10');
    iconEl.setAttribute('height', '10');
    iconEl.classList.add('visibility-toggle');
    iconEl.addEventListener('click', () => hideColumn(state, normalizedHeaderName));

    const thEl = document.createElement('th');
    thEl.textContent = headerName;
    thEl.appendChild(iconEl);
    headersRowEl.appendChild(thEl);
  });

  mountPoint.appendChild(headersRowEl);
};

// main render function,
// creates mount points and calls other render functions and pass arguments to them
// calledBy and dataNotNull arguments passed to highlight function
// by using it, highlight determines which filter was called
// and highlight :) keywords properly
export default (data, calledBy, dataNotNull = true, state) => {
  const pageSelectorsDiv = document.getElementById('pagination');
  removeAllChildren(pageSelectorsDiv);
  renderPageSelectors(state, pageSelectorsDiv);

  const visibilitySelectorsDiv = document.getElementById('visibility-selectors');
  removeAllChildren(visibilitySelectorsDiv);
  renderVisibilitySelectors(state, visibilitySelectorsDiv);

  const rootDiv = document.getElementById('root');
  removeAllChildren(rootDiv);

  const tableEl = document.createElement('table');
  renderTableHeaders(state, tableEl);
  renderTableRows(data, state, tableEl);

  rootDiv.appendChild(tableEl);

  // calledBy === 'changePage' -> highlight keywords even after page change
  if (!!state.keyword && (calledBy === 'overall' || calledBy === 'changePage') && dataNotNull) {
    const tdElements = [...document.getElementsByTagName('td')] // get all TD els
      .filter(el => !el.className.includes('img'));
    highlight(state.keyword, tdElements, 'yellow');
  }

  if (!!state.colKeyword && (calledBy === 'column' || calledBy === 'changePage') && dataNotNull) {
    // get specific column TD's
    const tdElements = [...document.getElementsByClassName(state.columnName)];
    highlight(state.colKeyword, tdElements, 'red');
  }
};
