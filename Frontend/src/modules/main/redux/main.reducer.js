import { createReducer } from "@reduxjs/toolkit";
import { actions as mainActions } from "..";

const initialState = {
    appState: {
        loggedIn: false
    },
    sessionState: {
        pollAPI: false,
        username: '',
        sessionId: '',
        userId: '',
        availabilities: [],
        friends: [],
        friendRequests: [],
        groups: [],
        sessionTimestamp: undefined
    }
};

const persistedInitialState = JSON.parse(JSON.stringify(initialState));

// Read the session storage
persistedInitialState.appState.loggedIn = sessionStorage.getItem("state.appState.loggedIn") === "true" ? true : false;
persistedInitialState.sessionState.sessionId = sessionStorage.getItem("state.sessionState.sessionId") || undefined;
persistedInitialState.sessionState.userId = sessionStorage.getItem("state.sessionState.userId") || undefined;

export default createReducer(persistedInitialState, {
    [mainActions.setAppStateAction]: (state, action) => {
        state.appState = {...action.payload};
        sessionStorage.setItem("state.appState.loggedIn", state.appState.loggedIn);
    },
    [mainActions.setSessionStateAction]: (state, action) => {
        state.sessionState = {...action.payload};
        sessionStorage.setItem("state.sessionState.userId", state.sessionState.userId);
        sessionStorage.setItem("state.sessionState.sessionId", state.sessionState.sessionId);
    },
    [mainActions.clearSessionStateAction]: (state, action) => {
        sessionStorage.clear();
        return {...initialState};
    }
});
