import { createReducer } from "@reduxjs/toolkit";
import { actions as mainActions } from "..";

const initialState = {
    pollAPI: false,
    loggedIn: false,
    username: '',
    sessionId: '',
    userId: '',
    availabilities: [],
    friends: [],
    friendRequests: [],
    groups: [],
    sessionTimestamp: undefined
};

export default createReducer(initialState, {
    [mainActions.setAppStateAction]: (state, action) => {
        state = action.payload;
    },
    [mainActions.setSessionState]: (state, action) => {

    },
    [mainActions.clearSessionState]: (state, action) => {

    },
    [mainActions.getSessionState]: (state, action) => {

    }
});
