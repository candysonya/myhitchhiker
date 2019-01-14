import { DtoCollectionWithRecord } from '../../../api/interfaces/dto_collection';
import { DtoRecord } from '../../../api/interfaces/dto_record';
import { RunResult } from '../../../api/interfaces/dto_run_result';
import { StringUtil } from '../utils/string_util';
import { RecordCategory } from '../common/record_category';
import { requestStateDefaultValue, RequestState } from './request';
import {
	allProject,
	newRecordFlag,
	newRequestName,
	allParameter,
	existingRecordFlag,
	existingRequestName, newApiName
} from '../common/constants';
import { ParameterType } from '../common/parameter_type';
import { RequestStatus } from '../common/request_status';
import { ConflictType } from '../common/conflict_type';
import { DtoApi } from "../../../api/interfaces/dto_api";

export function getDefaultRecord(isInit: boolean = false): DtoRecord {
    return {
        id: isInit ? newRecordFlag : `${newRecordFlag}${StringUtil.generateUID()}`,
        category: RecordCategory.record,
        name: newRequestName(),
        collectionId: '',
        parameterType: ParameterType.ManyToMany,
        headers: [],
	    apiId: '-1'
    };
}

export function getApiRecord(isInit: boolean = false): DtoRecord {
	return {
		id: isInit ? newRecordFlag : `${newRecordFlag}${StringUtil.generateUID()}`,
		category: RecordCategory.api,
		name: newApiName(),
		collectionId: '',
		parameterType: ParameterType.ManyToMany,
		headers: [],
		apiId: '-1'
	};
}

export function getExistingRecord(): DtoRecord {
	return {
		id: existingRecordFlag,
		category: RecordCategory.existing,
		name: existingRequestName(),
		collectionId: '',
		parameterType: ParameterType.ManyToMany,
		headers: [],
		apiId: '-1'
	};
}

export function getNewApi(): DtoApi {
	return {
		id: `${StringUtil.generateUID()}`,
		name: '',
		description: '',
		method: 'GET',
		uri: '',
		param: '',
		header: '',
		isJson: false,
		author: '',
		keyword: ''
	};
}

export const getExistingRecordState: () => RecordState = () => {
	const newRecord = getExistingRecord();
	return {
		name: newRecord.name || newRequestName(),
		record: newRecord,
		isChanged: false,
		isRequesting: false,
		parameter: allParameter,
		conflictType: ConflictType.none,
	};
};

export const getNewRecordState: () => RecordState = () => {
    const newRecord = getDefaultRecord();
    return {
        name: newRecord.name || newRequestName(),
        record: newRecord,
        isChanged: false,
        isRequesting: false,
        parameter: allParameter,
        conflictType: ConflictType.none,
    };
};

export const getNewApiRecordState: () => RecordState = () => {
	const newRecord = getApiRecord();
	return {
		name: newApiName(),
		record: newRecord,
		isChanged: false,
		isRequesting: false,
		parameter: allParameter,
		conflictType: ConflictType.none,
	};
};

export interface CollectionState {

    collectionsInfo: DtoCollectionWithRecord;

    openKeys: string[];

    selectedProject: string;

    fetchCollectionState: RequestState;
}

export interface DisplayRecordsState {

    activeKey: string;

    recordStates: _.Dictionary<RecordState>;

    recordsOrder: string[];

    responseState: ResponseState;

}

export interface ApiListState {

	apis: _.Dictionary<Array<ApiState>>;

	filter: string;

	search: string;

}

export interface ApiState {

	id: string;

	name: string;

	keyword: string;

	uri: string;

	author: string;

	isJson: boolean;

	method: string;

	description: string;

	header: string;

	param: string;

}

export interface RecordState {

    name: string;

    record: DtoRecord;

    isChanged: boolean;

    isRequesting: boolean;

    parameter: string;

    parameterStatus?: ParameterStatusState;

    conflictType: ConflictType;

    notShowConflict?: boolean;

}

export interface ParameterStatusState {

    [id: string]: RequestStatus;
}

export interface ResponseState {

    [id: string]: { runResult: RunResult } | ResponseState;
}

export const collectionDefaultValue: CollectionState = {
    fetchCollectionState: requestStateDefaultValue,
    openKeys: [],
    selectedProject: allProject,
    collectionsInfo: {
        collections: {},
        records: {}
    }
};

export const apiListDefaultValue: ApiListState = {
	apis: {
		['工具开发']: [{
			id: '999',
			name: '888',
			description: 'faljdlfajdlafdadfa',
			keyword: '工具开发',
			uri: '/get/all/apis',
			method: 'GET',
			author: 'wangchan',
			isJson: false,
			header: '{"you": "see","I": "seetoo"}',
			param: '{"hi": true,"like": false}'
		}]
	},
	filter: 'all',
	search: ''
};

export const displayRecordsDefaultValue: DisplayRecordsState = {
	activeKey: existingRecordFlag,
	recordsOrder: [existingRecordFlag],
	recordStates:
	{
		[existingRecordFlag]: {
			name: existingRequestName(),
			record: getExistingRecord(),
			isChanged: false,
			isRequesting: false,
			parameter: allParameter,
			conflictType: ConflictType.none
		}
	},
	responseState: {}
};
/*
export const displayRecordsDefaultValue: DisplayRecordsState = {
    activeKey: newRecordFlag,
    recordsOrder: [newRecordFlag],
    recordStates:
    {
        [newRecordFlag]: {
            name: newRequestName(),
            record: getDefaultRecord(true),
            isChanged: false,
            isRequesting: false,
            parameter: allParameter,
            conflictType: ConflictType.none
        }
    },
    responseState: {}
};
 */