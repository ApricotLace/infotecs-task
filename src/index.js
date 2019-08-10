import * as controllers from './stateControllers';
import { dataJson } from './data';

// creating blank state
const state = {
  initialState: [],
  currentData: [],
  currentPage: 0,
  pages: [],
  keyword: '',
  colKeyword: '',
  columnName: '',
  visibilityFilters: {
    id: true,
    firstname: true,
    lastname: true,
    email: true,
    gender: true,
    memo: true,
    img: true,
  },
};

// state initialisation
const data = JSON.parse(dataJson);
state.initialState = data;
controllers.paginate(data, 'main', state);

// state controllers initialisation
document
  .getElementById('filter-form')
  .addEventListener('submit', event => controllers.filter(event, state));

document
  .getElementById('filter-by-column-form')
  .addEventListener('submit', event => controllers.columnFilter(event, state));

document
  .getElementById('reset-button')
  .addEventListener('click', event => controllers.reset(event, state));

document
  .getElementById('close-modal')
  .addEventListener('click', controllers.close);
