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

export default createReducer(initialState, {
    [mainActions.setAppStateAction]: (state, action) => {
        state.appState = action.payload;
    },
    [mainActions.setSessionStateAction]: (state, action) => {
        state.sessionState = action.payload;
    },
    [mainActions.clearSessionStateAction]: (state, action) => {
        state = initialState;
    }
});
