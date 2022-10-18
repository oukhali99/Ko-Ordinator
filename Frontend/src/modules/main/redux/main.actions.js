import { createAction } from "@reduxjs/toolkit";

export const setAppStateAction = createAction("main/setAppStateAction");
export const setSessionState = createAction("main/setSessionState");
export const clearSessionState = createAction("main/clearSessionState");
export const getSessionState = createAction("main/getSessionState");

export const setAppState = (data) => async (dispatch, getState) => {
    dispatch(setAppStateAction(data));
};
