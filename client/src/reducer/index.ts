import { combineReducers } from 'redux';
import { root as displayRecordsState, collectionState } from './collection';
import { State } from '../state';
import { UpdateDisplayRecordType, UpdateDisplayRecordPropertyType, SaveAsRecordType, SaveRecordType, MoveRecordType } from '../action/record';
import * as _ from 'lodash';
import { uiState } from './ui';
import { userState } from './user';
import { apiListState } from "./api";
import { projectState } from './project';
import { environmentState } from './environment';
import { FetchLocalDataSuccessType } from '../action/local_data';
import { localDataState } from './local_data';
import { syncDefaultValue } from '../state/ui';
import { scheduleState } from './schedule';
import { ReloadType } from '../action/index';
import { DtoCollection } from '../../../api/interfaces/dto_collection';
import { DtoRecord } from '../../../api/interfaces/dto_record';
import { QuitProjectType, DisbandProjectType } from '../action/project';
import { getNewRecordState, getExistingRecordState, RecordState } from '../state/collection';
import { stressTestState } from './stress';
import { SyncUserDataSuccessType } from '../action/user';
import { ConflictType } from '../common/conflict_type';
import {existingRecordFlag, newRecordFlag} from '../common/constants';
import { ShowTimelineType, BatchCloseType } from '../action/ui';
import { CompareUtil } from '../utils/compare_util';
import { CloseAction } from '../common/custom_type';
import { documentState } from './document';

export const reduceReducers = (...reducers) => {
    return (state, action) =>
        reducers.reduce(
            (p, r) => r(p, action),
            state
        );
};

export function rootReducer(state: State, action: any): State {
    const intermediateState = combineReducers<State>({
        localDataState,
        collectionState,
        displayRecordsState,
        uiState,
	    apiListState,
        userState,
        projectState,
        environmentState,
        scheduleState,
        stressTestState,
        documentState
    })(state, action);

    const finalState = multipleStateReducer(intermediateState, action);

    return finalState;
};

export function multipleStateReducer(state: State, action: any): State {
    switch (action.type) {
        case SaveAsRecordType:
        case SaveRecordType:
        case MoveRecordType: {
            const record = action.value.record;
            const recordDict = state.collectionState.collectionsInfo.records[record.collectionId];
            if (recordDict && recordDict[record.id]) {
                const history = recordDict[record.id].history;
                if (history && history.length > 0) {
                    history[history.length - 1].user = state.userState.userInfo;
                }
            }
            return state;
        }
        case ReloadType: {
            location.reload(true);
            return state;
        }
        case ShowTimelineType: {
            let record;
            const ckeys = _.keys(state.collectionState.collectionsInfo.records);
            for (let cid of ckeys) {
                record = state.collectionState.collectionsInfo.records[cid][action.value];
                if (record) {
                    break;
                }
            }
            return { ...state, uiState: { ...state.uiState, timelineState: { isShow: true, record } } };
        }
        case QuitProjectType:
        case DisbandProjectType: {
            const projectId = action.value.id;
            const originRecords = state.collectionState.collectionsInfo.records;
            const collections = _.chain(state.collectionState.collectionsInfo.collections).values<DtoCollection>().filter(c => c.projectId !== projectId).keyBy('id').value();
            const records = _.pick(originRecords, _.keys(collections)) as _.Dictionary<_.Dictionary<DtoRecord>>;
            const newRecordState = getNewRecordState();
            let recordStates = _.chain(state.displayRecordsState.recordStates).values<RecordState>().filter(c => !c.record.collectionId || !!collections[c.record.collectionId]).keyBy('record.id').value();
            let recordsOrder = state.displayRecordsState.recordsOrder.filter(r => !!recordStates[r]);
            if (_.keys(recordStates).length === 0) {
                recordStates = { [newRecordState.record.id]: newRecordState };
                recordsOrder = [newRecordState.record.id];
            }
            const activeKey = recordStates[state.displayRecordsState.activeKey] ? state.displayRecordsState.activeKey : recordStates[_.keys(recordStates)[0]].record.id;
            return {
                ...state, collectionState: {
                    ...state.collectionState, collectionsInfo: {
                        ...state.collectionState.collectionsInfo, collections, records
                    }
                }, displayRecordsState: {
                    ...state.displayRecordsState,
                    activeKey,
                    recordsOrder,
                    recordStates
                }
            };
        }
        case UpdateDisplayRecordPropertyType: {
            const { activeKey, recordStates } = state.displayRecordsState;
            return updateStateRecord(state, { ...recordStates[activeKey].record, ...action.value } );
        }
        case UpdateDisplayRecordType: {
            return updateStateRecord(state, action.value);
        }
        case FetchLocalDataSuccessType: {
            if (!action.value) {
                return state;
            }
            const { displayRecordsState, uiState, apiListState, collectionState, projectState, environmentState, scheduleState } = action.value as State;
            const onlineRecords = state.collectionState.collectionsInfo.records;

            // TODO: if record's collection is removed, should reset record's id and collection id.
            _.keys(displayRecordsState.recordStates).forEach(key => {
                const recordState = displayRecordsState.recordStates[key];
                const { record, isChanged } = recordState;
                if (record) {
                    recordState.parameterStatus = {};
                    recordState.isRequesting = false;
                    const onlineRecordDict = onlineRecords[record.collectionId];
                    if (onlineRecordDict && onlineRecordDict[record.id]) {
                        recordState.name = onlineRecordDict[record.id].name;
                        if (!isChanged) {
                            recordState.record = onlineRecordDict[record.id];
                        }
                    }
                }
            });
            // TODO: should give some tip for the diff between online data and local data.
            return {
                ...state,
                displayRecordsState,
				apiListState,
                uiState: { ...uiState, syncState: syncDefaultValue },
                collectionState: {
                    ...state.collectionState,
                    selectedProject: collectionState.selectedProject,
                    openKeys: collectionState.openKeys.length > 0 ? collectionState.openKeys : state.collectionState.openKeys
                },
                projectState: {
                    ...state.projectState,
                    activeProject: projectState.activeProject
                },
                environmentState: {
                    ...state.environmentState,
                    activeEnv: environmentState.activeEnv
                },
                scheduleState: {
                    ...state.scheduleState,
                    scheduleRecordsInfo: scheduleState.scheduleRecordsInfo || {},
                    activeSchedule: scheduleState.activeSchedule
                }
            };
        }
        case SyncUserDataSuccessType: {
            const { collection } = action.value.result;
            const displayRecordsState = state.displayRecordsState;
            const newDisplayRecordState = { ...displayRecordsState, recordStates: { ...displayRecordsState.recordStates } };
            if (!collection) {
                return state;
            }
            _.keys(displayRecordsState.recordStates).forEach(key => {
                const recordState = displayRecordsState.recordStates[key];
                const { record, isChanged } = recordState;
                const isNew = key.startsWith(newRecordFlag);
                const getOnlineRecord = () => collection.records[record.collectionId][key];
                const getCurrentRecord = () => state.collectionState.collectionsInfo.records[record.collectionId][key];
                const getConflictType = () => newDisplayRecordState.recordStates[key].conflictType;
                if (!isNew) {
                    const isDeleted = !collection.records[record.collectionId] || !getOnlineRecord();
                    if (isDeleted) {
                        if (getConflictType() !== ConflictType.delete) {
                            newDisplayRecordState.recordStates[key] = { ...recordState, conflictType: ConflictType.delete };
                        }
                    } else if (isChanged) {
                        if (getConflictType() !== ConflictType.modify && !CompareUtil.compare(getCurrentRecord(), getOnlineRecord())) {
                            newDisplayRecordState.recordStates[key] = { ...recordState, conflictType: ConflictType.modify };
                        }
                    } else {
                        if (!CompareUtil.compare(getOnlineRecord(), getCurrentRecord())) {
                            newDisplayRecordState.recordStates[key] = { ...recordState, name: getOnlineRecord().name, record: getOnlineRecord() };
                        }
                    }
                }
            });
            return {
                ...state,
                collectionState: { ...state.collectionState, collectionsInfo: collection },
                displayRecordsState: newDisplayRecordState
            };
        }
        case BatchCloseType: {
            const { activedTab, closeAction } = action.value;
            const uiState = { ...state.uiState, closeState: { activedTabBeforeClose: activedTab, closeAction } };
            if (closeAction === CloseAction.none) {
                return { ...state, uiState };
            }
            const recordsOrder = [...state.displayRecordsState.recordsOrder];
            const recordStates = { ...state.displayRecordsState.recordStates };
            const responseState = { ...state.displayRecordsState.responseState };
            let activeKey = activedTab;
            state.displayRecordsState.recordsOrder.forEach((t, i) => {
                const recordState = state.displayRecordsState.recordStates[t];
                if (recordState) {
                    if (!(closeAction === CloseAction.exceptActived && recordState.record.id === activedTab) && (!recordState.isChanged || t.startsWith(newRecordFlag))) {
                    	recordsOrder.splice(recordsOrder.indexOf(t), 1);
                    	Reflect.deleteProperty(recordStates, t);
                        Reflect.deleteProperty(responseState, t);
                    }
                }
            });
            if (_.keys(recordStates).length === 0) {
                const newRecordState = getExistingRecordState();
                recordStates[newRecordState.record.id] = newRecordState;
                activeKey = newRecordState.record.id;
                recordsOrder.push(activeKey);
                uiState.closeState.closeAction = CloseAction.none;
            }else if(closeAction === CloseAction.all) {
            	uiState.closeState.closeAction = CloseAction.none;
            	activeKey = existingRecordFlag;
            }else if (closeAction === CloseAction.saved) {
                uiState.closeState.closeAction = CloseAction.none;
                activeKey = recordsOrder.find(r => r === activedTab) ? activedTab : recordsOrder[0];
            } else if (closeAction === CloseAction.exceptActived) {
                if (recordsOrder.length === 1) {
	                if (recordsOrder[0].startsWith(newRecordFlag)) {
		                const temp = recordStates[recordsOrder[0]];
		                Reflect.deleteProperty(recordStates, temp.record.id);
		                const newRecordState = getExistingRecordState();
		                recordStates[newRecordState.record.id] = newRecordState;
		                recordStates[temp.record.id] = temp;
		                recordsOrder.splice(0, 0, existingRecordFlag);
		                activeKey = temp.record.id;
	                }
                    uiState.closeState.closeAction = CloseAction.none;
                } else {
                    activeKey = recordsOrder.find(r => r !== activedTab);
                }
            } else {
                activeKey = recordsOrder[0];
            }

            const displayRecordsState = { ...state.displayRecordsState, recordStates, responseState, recordsOrder, activeKey };
            return { ...state, uiState, displayRecordsState };
        }
        default:
            return state;
    }

    function updateStateRecord(rootState: State, record: any): State {
        const cid = record.collectionId;
        let isChanged = true;
        if (cid) {
            isChanged = !CompareUtil.compare(rootState.collectionState.collectionsInfo.records[record.collectionId][record.id], record);
        }
        const recordStates = rootState.displayRecordsState.recordStates;
        return {
            ...rootState,
            displayRecordsState: {
                ...rootState.displayRecordsState,
                recordStates: { ...recordStates, [record.id]: { ...recordStates[record.id], record, isChanged } }
            }
        };
    }
}