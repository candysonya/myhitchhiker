import {call, put, takeEvery, takeLatest} from 'redux-saga/effects';
import RequestManager from '../utils/request_manager';
import { Urls } from '../utils/urls';

import { actionCreator, syncAction } from './index';
import {HttpMethod} from "../common/http_method";
import {delay} from "redux-saga";
export const GetAllApiType = 'get all api';
export const GetApiSuccessType = 'get api success';
export const GetApiFailType = 'get api fail';
export const ApiSearchType = 'search api by uri';
export const ApiFilterType = 'filter api by keyword';
export const SaveApiType = 'save api';
export const DeleteApiType = 'delete api';
export const SyncCollectionType = 'sync collection';

export function* getApis() {
	yield takeLatest(GetAllApiType, function* () {
		try {
			const res = yield call(RequestManager.get, Urls.getUrl('apis'));
			const body = yield res.json();
			if (res.ok === false) {
				yield put(actionCreator(GetApiFailType, `${res.status} ${res.statusText}`));
				return;
			}
			if (body.success) {
				yield put(actionCreator(GetApiSuccessType, body));
			} else {
				yield put(actionCreator(GetApiFailType, body.message()));
			}
		} catch (err) {
			yield put(actionCreator(GetApiFailType, err.toString()));
		}
	});
}

export function* saveApi() {
	yield takeLatest(SaveApiType, function* (action : any) {
		const method = HttpMethod.POST;
		const channelAction = syncAction({ type: SaveApiType, method: method, url: Urls.getUrl(`api/save`), body: action.value.api });
		yield put(channelAction);
		yield delay(1000);
		const res = yield call(RequestManager.get, Urls.getUrl('collections'));
		const body = yield res.json();
		if (body.success) {
			yield put(actionCreator(SyncCollectionType, body));
		}
	});
}

export function* deleteApi() {
	yield takeEvery(DeleteApiType, function* (action: any) {
		const channelAction = syncAction({ type: DeleteApiType, method: HttpMethod.DELETE, url: Urls.getUrl(`api/${action.value}`) });
		yield put(channelAction);
	});
}