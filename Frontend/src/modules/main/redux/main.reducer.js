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
        state.appState.loggedIn = action.payload.loggedIn || state.appState.loggedIn;
    },
    [mainActions.setSessionStateAction]: (state, action) => {
        state.sessionState.pollAPI = action.payload.loggedIn || state.sessionState.pollAPI;
        state.sessionState.username = action.payload.username || state.sessionState.username;
        state.sessionState.sessionId = action.payload.sessionId || state.sessionState.sessionId;
        state.sessionState.userId = action.payload.userId || state.sessionState.userId;
        state.sessionState.availabilities = action.payload.availabilities || state.sessionState.availabilities;
        state.sessionState.friends = action.payload.friends || state.sessionState.friends;
        state.sessionState.friendRequests = action.payload.friendRequests || state.sessionState.friendRequests;
        state.sessionState.groups = action.payload.groups || state.sessionState.groups;
        state.sessionState.sessionTimestamp = action.payload.sessionTimestamp || state.sessionState.sessionTimestamp;
    },
    [mainActions.clearSessionStateAction]: (state, action) => {
        state = initialState;
    }
});
