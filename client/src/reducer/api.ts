import { apiListDefaultValue, ApiListState } from '../state/collection';
import {
	GetApiSuccessType,
	ApiSearchType,
	ApiFilterType,
	DeleteApiType
} from '../action/api';

export function apiListState(state: ApiListState = apiListDefaultValue, action: any): ApiListState {
	switch (action.type) {
		case GetApiSuccessType: {
			let allapis = {};
			for(let i = 0; i < action.value.result.length; i++) {
				if(allapis.hasOwnProperty(action.value.result[i].keyword)) {
					allapis[action.value.result[i].keyword].push(action.value.result[i]);
				}else {
					allapis[action.value.result[i].keyword] = [action.value.result[i]];
				}
			}
			return { ...state, apis: { ...allapis }};
		}
		case ApiSearchType: {
			return { ...state, search: action.value }
		}
		case ApiFilterType: {
			return { ...state, filter: action.value }
		}
		case DeleteApiType: {
			let newApis = state.apis;
			Object.keys(newApis).forEach((key) => {
				for(let i = 0; i < newApis[key].length; ++i) {
					if (newApis[key][i].id === action.value) {
						newApis[key].splice(i, 1);
						if(newApis[key].length == 0) {
							delete newApis[key];
						}
						break;
					}
				}
			});
			return { ...state, apis: { ...newApis }};
		}
		default:
			return state;
	}
}