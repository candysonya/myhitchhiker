import React from 'react';
import { connect, Dispatch } from 'react-redux';
import ScheduleList from './schedule_list';
import { DtoSchedule } from '../../../../api/interfaces/dto_schedule';
import { DtoUser } from '../../../../api/interfaces/dto_user';
import { State } from '../../state/index';
import * as _ from 'lodash';
import { DtoEnvironment } from '../../../../api/interfaces/dto_environment';
import { actionCreator } from '../../action/index';
import { SaveScheduleType, ActiveScheduleType, DeleteScheduleType, RunScheduleType, SetScheduleRecordsModeType, SetScheduleRecordsPageType, SetScheduleRecordsExcludeNotExistType } from '../../action/schedule';
import ScheduleRunHistoryGrid from './schedule_run_history_grid';
import { noEnvironment, unknownName } from '../../common/constants';
import { DtoRecord } from '../../../../api/interfaces/dto_record';
import { ScheduleRunState, ScheduleRecordsInfo } from '../../state/schedule';
import { DtoCollection } from '../../../../api/interfaces/dto_collection';
import { ScheduleRecordsDisplayMode } from '../../common/custom_type';
import SiderLayout from '../../components/sider_layout';

interface ScheduleStateProps {

    user: DtoUser;

    activeSchedule: string;

    schedules: _.Dictionary<DtoSchedule>;

    collections: _.Dictionary<DtoCollection>;

    environments: _.Dictionary<DtoEnvironment[]>;

    records: _.Dictionary<DtoRecord>;

    runState: _.Dictionary<ScheduleRunState>;

    scheduleRecordsInfo: _.Dictionary<ScheduleRecordsInfo>;
}

interface ScheduleDispatchProps {

    createSchedule(schedule: DtoSchedule);

    selectSchedule(scheduleId: string);

    updateSchedule(schedule: DtoSchedule);

    deleteSchedule(scheduleId: string);

    runSchedule(scheduleId: string);

    setScheduleRecordsPage(id: string, page: number);

    setScheduleRecordsMode(id: string, mode: ScheduleRecordsDisplayMode);

    setScheduleRecordsExcludeNotExist(id: string, excludeNotExist: boolean);
}

type ScheduleProps = ScheduleStateProps & ScheduleDispatchProps;

interface ScheduleState { }

class Schedule extends React.Component<ScheduleProps, ScheduleState> {

    private get scheduleArr() {
        return _.chain(this.props.schedules).values<DtoSchedule>().sortBy('name').value();
    }

    private getEnvName = (envId: string) => {
        return !envId || envId === noEnvironment ? noEnvironment : (this.getEnvNames()[envId] || unknownName);
    }

    private getEnvNames = () => {
        const environmentNames: _.Dictionary<string> = {};
        _.chain(this.props.environments).values().flatten<DtoEnvironment>().value().forEach(e => environmentNames[e.id] = e.name);
        return environmentNames;
    }

    public render() {
        const { createSchedule, selectSchedule, runState, updateSchedule, deleteSchedule, user, activeSchedule, collections, environments, records, schedules, runSchedule, scheduleRecordsInfo, setScheduleRecordsPage, setScheduleRecordsMode, setScheduleRecordsExcludeNotExist } = this.props;
        const schedule = schedules[activeSchedule] || {};
        const envName = this.getEnvName(schedule.environmentId);
        const compareEnvName = this.getEnvName(schedule.compareEnvironmentId);

        return (
            <SiderLayout
                sider={<ScheduleList
                    schedules={this.scheduleArr}
                    user={user}
                    activeSchedule={activeSchedule}
                    collections={collections}
                    environments={environments}
                    createSchedule={createSchedule}
                    selectSchedule={selectSchedule}
                    updateSchedule={updateSchedule}
                    deleteSchedule={deleteSchedule}
                    runSchedule={runSchedule}
                    runState={runState}
                    records={records}
                />}
                content={(
                    <div className="schedule-content">
                        <ScheduleRunHistoryGrid
                            schedule={schedule}
                            scheduleRecordsInfo={scheduleRecordsInfo ? scheduleRecordsInfo[activeSchedule] : undefined}
                            envName={envName}
                            compareEnvName={compareEnvName}
                            envNames={this.getEnvNames()}
                            records={records}
                            isRunning={runState[activeSchedule] ? runState[activeSchedule].isRunning : false}
                            consoleRunResults={runState[activeSchedule] ? runState[activeSchedule].consoleRunResults : []}
                            setScheduleRecordsPage={setScheduleRecordsPage}
                            setScheduleRecordsMode={setScheduleRecordsMode}
                            setScheduleRecordsExcludeNotExist={setScheduleRecordsExcludeNotExist}
                        />
                    </div>
                )}
            />
        );
    }
}

const mapStateToProps = (state: State): ScheduleStateProps => {
    const { schedules, activeSchedule, runState, scheduleRecordsInfo } = state.scheduleState;
    const records = _.chain(state.collectionState.collectionsInfo.records).values<_.Dictionary<DtoRecord>>().value();
    return {
        user: state.userState.userInfo,
        activeSchedule,
        collections: state.collectionState.collectionsInfo.collections,
        environments: state.environmentState.environments,
        schedules,
        records: records.length === 0 ? {} : records.reduce((p, c) => ({ ...p, ...c })),
        runState,
        scheduleRecordsInfo
    };
};

const mapDispatchToProps = (dispatch: Dispatch<any>): ScheduleDispatchProps => {
    return {
        createSchedule: (schedule) => dispatch(actionCreator(SaveScheduleType, { isNew: true, schedule })),
        updateSchedule: (schedule) => dispatch(actionCreator(SaveScheduleType, { isNew: false, schedule })),
        deleteSchedule: (scheduleId) => { dispatch(actionCreator(DeleteScheduleType, scheduleId)); },
        selectSchedule: (scheduleId) => dispatch(actionCreator(ActiveScheduleType, scheduleId)),
        runSchedule: (scheduleId) => dispatch(actionCreator(RunScheduleType, scheduleId)),
        setScheduleRecordsPage: (id, pageNum) => dispatch(actionCreator(SetScheduleRecordsPageType, { id, pageNum })),
        setScheduleRecordsMode: (id, mode) => dispatch(actionCreator(SetScheduleRecordsModeType, { id, mode })),
        setScheduleRecordsExcludeNotExist: (id, excludeNotExist) => dispatch(actionCreator(SetScheduleRecordsExcludeNotExistType, { id, excludeNotExist }))
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Schedule);