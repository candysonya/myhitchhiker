import React from 'react';
import { DtoSchedule } from '../../../../api/interfaces/dto_schedule';
import ScheduleItem from './schedule_item';
import { SelectParam } from 'antd/lib/menu';
import { DtoUser } from '../../../../api/interfaces/dto_user';
import { StringUtil } from '../../utils/string_util';
import { Tooltip, Button, Menu, Checkbox } from 'antd';
import PerfectScrollbar from 'react-perfect-scrollbar';
import ScheduleEditDialog from './schedule_edit_dialog';
import { Period, TimerType } from '../../common/period';
import { NotificationMode, MailMode } from '../../common/notification_mode';
import { noEnvironment, newScheduleName, unknownName } from '../../common/constants';
import { DateUtil } from '../../utils/date_util';
import * as _ from 'lodash';
import { ScheduleRunState } from '../../state/schedule';
import { DtoRecord } from '../../../../api/interfaces/dto_record';
import { DtoEnvironment } from '../../../../api/interfaces/dto_environment';
import { DtoCollection } from '../../../../api/interfaces/dto_collection';
import Msg from '../../locales';

interface ScheduleListProps {

    user: DtoUser;

    activeSchedule: string;

    schedules: DtoSchedule[];

    collections: _.Dictionary<DtoCollection>;

    environments: _.Dictionary<DtoEnvironment[]>;

    records: _.Dictionary<DtoRecord>;

    runState: _.Dictionary<ScheduleRunState>;

    createSchedule(schedule: DtoSchedule);

    selectSchedule(scheduleId: string);

    updateSchedule(schedule: DtoSchedule);

    deleteSchedule(scheduleId: string);

    runSchedule(scheduleId: string);
}

interface ScheduleListState {

    schedule: DtoSchedule;

    isCreateNew: boolean;

    isEditDlgOpen: boolean;

    isEditDlgRendered: boolean;

    selectSome: boolean;

    selectAll: boolean;

    selectItems: string[];
}

const createDefaultSchedule: (user: DtoUser) => DtoSchedule = (user: DtoUser) => {
    return {
        id: StringUtil.generateUID(),
        name: newScheduleName(),
        ownerId: user.id,
        collectionId: '',
        environmentId: noEnvironment,
        needCompare: false,
        compareEnvironmentId: noEnvironment,
        period: Period.daily,
        timer: TimerType.Day,
        hour: DateUtil.localHourToUTC(7),
        notification: NotificationMode.none,
        mailMode: MailMode.mailWhenFail,
        mailIncludeSuccessReq: false,
        emails: '',
        needOrder: false,
        recordsOrder: '',
        suspend: false,
        scheduleRecords: [],
        recordCount: 0
    };
};

class ScheduleList extends React.Component<ScheduleListProps, ScheduleListState> {

    constructor(props: ScheduleListProps) {
        super(props);
        this.state = {
            schedule: createDefaultSchedule(props.user),
            isCreateNew: true,
            isEditDlgOpen: false,
            isEditDlgRendered: false,
            selectAll: false,
            selectSome: false,
            selectItems: []
        };
    }

    public shouldComponentUpdate(nextProps: ScheduleListProps, nextState: ScheduleListState) {
        return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
    }

    private onSelectChanged = (param: SelectParam) => {
        this.props.selectSchedule(param.item.props.data.id);
    }

    private onCreateSchedule = () => {
        this.setState({
            ...this.state,
            isEditDlgOpen: true,
            isCreateNew: true,
            schedule: createDefaultSchedule(this.props.user),
            isEditDlgRendered: false
        });
    }

    private saveSchedule = (schedule) => {
        this.setState({ ...this.state, isEditDlgOpen: false });
        this.state.isCreateNew ? this.props.createSchedule(schedule) : this.props.updateSchedule(schedule);
    }

    private editSchedule = (schedule) => {
        this.setState({
            ...this.state,
            isEditDlgOpen: true,
            isCreateNew: false,
            isEditDlgRendered: false,
            schedule: { ...schedule, environmentId: schedule.environmentId || noEnvironment }
        });
    }

    private getEnvName = (envId: string) => {
        return !envId || envId === noEnvironment ? noEnvironment : (this.getEnvNames()[envId] || unknownName);
    }

    private getEnvNames = () => {
        const environmentNames: _.Dictionary<string> = {};
        _.chain(this.props.environments).values().flatten<DtoEnvironment>().value().forEach(e => environmentNames[e.id] = e.name);
        return environmentNames;
    }

    private onItemSelected = (isSelected: boolean, id: string) => {
        let selectItems: Array<string>;
        const items = this.state.selectItems;
        const schedules = this.props.schedules;
        if (isSelected) {
            selectItems = items.find(i => i === id) ? items : [...items, id];
        } else {
            selectItems = items.filter(i => i !== id);
        }
        const selectAll = selectItems.length === schedules.length;
        const selectSome = selectItems.length > 0 && selectItems.length < schedules.length;
        this.setState({ ...this.state, selectItems, selectAll, selectSome });
    }

    private onSelectAll = event => {
        const isChecked = (event.target as any).checked;
        this.setState({
            ...this.state,
            selectItems: isChecked ? this.props.schedules.map(s => s.id) : [],
            selectAll: isChecked,
            selectSome: false
        });
    }

    private runSelected = () => {
        const { selectItems } = this.state;
        selectItems.forEach(i => this.props.runSchedule(i));
    }

    public render() {
        const { runState, activeSchedule, schedules, collections, environments, user, deleteSchedule, runSchedule, updateSchedule } = this.props;
        const { selectAll, selectSome, selectItems } = this.state;
        return (
            <div>
                <div className="small-toolbar">
                    <Checkbox
                        indeterminate={selectSome}
                        checked={selectAll}
                        onChange={this.onSelectAll}
                    />
                    <span style={{ marginLeft: -10 }}>{Msg('Schedule.Schedulers')}</span>
                    {selectItems.length > 0 ? (
                        <Tooltip mouseEnterDelay={1} placement="bottom" title={Msg('Schedule.RunSchedulers')}>
                            <Button
                                className="icon-btn"
                                style={{ right: 42 }}
                                type="primary"
                                icon="play-circle-o"
                                onClick={this.runSelected}
                            />
                        </Tooltip>
                    ) : ''}
                    <Tooltip mouseEnterDelay={1} placement="bottom" title={Msg('Schedule.Create')}>
                        <Button
                            className="icon-btn schedule-add-btn"
                            type="primary"
                            icon="file-add"
                            onClick={this.onCreateSchedule}
                        />
                    </Tooltip>
                </div>
                <PerfectScrollbar>
                    <Menu
                        className="project-list"
                        mode="inline"
                        inlineIndent={0}
                        selectedKeys={[activeSchedule]}
                        onSelect={this.onSelectChanged}
                    >
                        {
                            schedules.filter(s => collections[s.collectionId]).map(t =>
                                (
                                    <Menu.Item key={t.id} data={t}>
                                        <ScheduleItem
                                            schedule={t}
                                            collectionName={collections[t.collectionId].name}
                                            environmentName={this.getEnvName(t.environmentId)}
                                            compareEnvName={this.getEnvName(t.compareEnvironmentId)}
                                            isOwner={t.ownerId === user.id}
                                            delete={() => deleteSchedule(t.id)}
                                            edit={() => this.editSchedule(t)}
                                            run={() => { console.log(`run schedule: ${t.id}`); runSchedule(t.id); }}
                                            suspend={() => updateSchedule({ ...t, suspend: !t.suspend })}
                                            isRunning={runState[t.id] ? runState[t.id].isRunning : false}
                                            isChecked={!!selectItems.find(i => i === t.id)}
                                            onCheck={isChecked => this.onItemSelected(isChecked, t.id)}
                                        />
                                    </Menu.Item>
                                )
                            )
                        }
                    </Menu>
                </PerfectScrollbar>
                <ScheduleEditDialog
                    schedule={this.state.schedule}
                    collections={collections}
                    environments={environments}
                    isEditDlgOpen={this.state.isEditDlgOpen}
                    records={_.values(this.props.records)}
                    isRendered={this.state.isEditDlgRendered}
                    render={() => this.setState({ ...this.state, isEditDlgRendered: true })}
                    onCancel={() => this.setState({ ...this.state, isEditDlgOpen: false })}
                    onOk={schedule => this.saveSchedule(schedule)}
                />
            </div>
        );
    }
}

export default ScheduleList;