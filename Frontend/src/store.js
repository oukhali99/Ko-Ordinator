import { configureStore } from '@reduxjs/toolkit'
import modules from "./modules";

export default configureStore({
	reducer: modules
});