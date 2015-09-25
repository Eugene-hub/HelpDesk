const extend = require('extend');
const ActionTypes = require('../constants/action-types');
const VisibilityFilters = require('../constants/folder-type');

const initialTickets = {
    isLoading: false,
    state: VisibilityFilters.SHOW_OPENED,
    activeProjects: (false === APP.countTickets) ? [] : Object.keys(APP.countTickets),
    sort: 'date asc',
    page: 1,
    detailedOpened: false,
    stateCount: {opened: 0, closed: 0},
    items: [],
    projects: []
};

function tickedIsShowed(state, ticket) {
    switch (state.state) {
        case VisibilityFilters.SHOW_OPENED:
            if (false === ticket.opened) {
                return false;
            }
            break;
        case VisibilityFilters.SHOW_CLOSED:
            if (true === ticket.opened) {
                return false;
            }
            break;
        default:
            break;
    }

    return (-1 !== state.activeProjects.indexOf(ticket.project));
}

function ticketsBy(sort) {
    if ('date' === sort[0]) {
        return function(i1, i2){
            if (i1.lastDate === i2.lastDate) {
                return 0;
            }

            if ('asc' === sort[1]) {
                return (i1.lastDate < i2.lastDate) ?  1 : -1;
            }

            return (i1.lastDate > i2.lastDate) ?  1 : -1;
        };
    }

    var ticketsByDate = ticketsBy(['date', 'asc']);

    return function(i1, i2){
        if (i1.opened === i2.opened) {
            return ticketsByDate(i1, i2);
        }

        if ('asc' === sort[1]) {
            return (i1.opened > i2.opened) ?  1 : -1;
        }

        return (i1.opened < i2.opened) ?  1 : -1;
    };
}

function tickets(state = initialTickets, action = {type: ''}) {
    switch (action.type) {
        case ActionTypes.RESET_TICKETS_STATE:
            return extend({}, initialTickets, {activeProjects: []});

        case ActionTypes.SET_STATE:
            let newState = extend({}, state, {state: action.filter});

            return newState;

        case ActionTypes.START_FETCH_ITEMS:
            return extend({}, state, {isLoading: true});

        case ActionTypes.END_FETCH_ITEMS:
            let resultItems = state.items;

            if (action.clear) {
                resultItems = action.items
            } else {
                action.items.forEach((item) => resultItems.push(item));
            }

            return extend({}, state, {isLoading: false, items: resultItems});

        case ActionTypes.SET_DETAIL_TICKET:
            return extend({}, state, {detailedOpened: action.ticket ? action.ticket : false});

        case ActionTypes.SET_NEW_PAGE:
            return extend({}, state, {page: (state.page + 1)});

        case ActionTypes.SET_ACTIVE_PROJECTS:
            return extend({}, state, {activeProjects: Object.keys(action.projects)});

        case ActionTypes.UPDATE_TICKET:
            // action.ticket;
            let oldTickets = state.items.filter((ticket) =>
                ticket.project == action.ticket.project
                && ticket.number == action.ticket.number
            );

            if (0 !== oldTickets.length) {
                let ticketIndex = state.items.indexOf(oldTickets[0]);

                let copyItems = state.items.splice(0);
                copyItems[ticketIndex] = action.ticket;

                let sort = state.sort.split(' ');

                return extend({}, state, {items: copyItems.sort(ticketsBy(sort))});
            }

            return state;

        case ActionTypes.ADD_TICKET:
            if (false === tickedIsShowed(state, action.ticket)) {
                return state;
            }

            let oldTicketsAdd = state.items.filter((ticket) =>
                ticket.project == action.ticket.project
                && ticket.number == action.ticket.number
            );

            if (0 === oldTicketsAdd.length) {
                let newItems = state.items;
                newItems.unshift(action.ticket);
                let sort = state.sort.split(' ');

                return extend({}, state, {items: newItems.sort(ticketsBy(sort))});
            }

            return state;

        case ActionTypes.TOGGLE_PROJECT:
            var activeProjects = state.activeProjects.slice(0);

            var indexProjectCode = activeProjects.indexOf(action.code);
            if (-1 === indexProjectCode) {
                activeProjects.push(action.code);
            } else {
                activeProjects.splice(indexProjectCode,1);
            }

            return extend({}, state, {activeProjects: activeProjects});

        case ActionTypes.SET_TICKET_LIST_SORT:
            return extend({}, state, {sort: action.sort});

        default:
            return state;
    }
}

module.exports = tickets;