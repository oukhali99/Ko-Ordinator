import * as actions from "./redux/main.actions";
import * as selectors from "./redux/main.selectors";
import reducer from "./redux/main.reducer";

export default reducer;

export { default as App } from "./components/App";
export { actions, selectors };
