import { createAction } from "@reduxjs/toolkit";

export const setAppStateAction = createAction("main/setAppStateAction");
export const setSessionStateAction = createAction("main/setSessionState");
export const clearSessionStateAction = createAction("main/clearSessionState");

export const setAppState = (data) => async (dispatch, getState) => {
    dispatch(setAppStateAction(data));
};

export const setSessionState = (data) => async (dispatch, getState) => {
    dispatch(setSessionStateAction(data));
};