import 'reflect-metadata';
import { Schedule } from '../models/schedule';
import { Record } from '../models/record';
import { ScheduleService } from '../services/schedule_service';
import { RecordService } from '../services/record_service';
import { RecordRunner } from './record_runner';
import * as _ from 'lodash';
import { RunResult } from '../interfaces/dto_run_result';
import { ScheduleRecord } from '../models/schedule_record';
import { ScheduleRecordService } from '../services/schedule_record_service';
import { ConnectionManager } from '../services/connection_manager';
import { EnvironmentService } from '../services/environment_service';
import { Environment } from '../models/environment';
import { NotificationMode, MailMode } from '../interfaces/notification_mode';
import { UserService } from '../services/user_service';
import { CollectionService } from '../services/collection_service';
import { ProjectService } from '../services/project_service';
import { MailService } from '../services/mail_service';
import { Log } from '../utils/log';
import { DateUtil } from '../utils/date_util';
import { RecordCategory } from '../common/record_category';
import { StringUtil } from '../utils/string_util';
import { Sandbox } from './sandbox';
import { Setting } from '../utils/setting';
import { ValidateUtil } from '../utils/validate_util';
import { BackupService } from '../services/backup_service';

export class ScheduleRunner {

    async run() {
        Log.info('schedule start.');
        Log.info('get all schedule.');
        await ConnectionManager.init();
        const schedules = await this.getAllSchedules();
        if (schedules.length === 0) {
            Log.info('schedules length is 0.');
            return;
        }
        Log.info('get records by collection ids.');
        const recordDict = await RecordService.getByCollectionIds(_.sortedUniq(schedules.map(s => s.collectionId)));
        await Promise.all(schedules.map(schedule => this.runSchedule(schedule, recordDict[schedule.collectionId], true)));

        Log.info('backup db start.');
        await BackupService.backupDB();
    }

    async runSchedule(schedule: Schedule, records?: Record[], isScheduleRun?: boolean, trace?: (msg: string) => void): Promise<any> {
        if (!records) {
            const collectionRecords = await RecordService.getByCollectionIds([schedule.collectionId]);
            records = collectionRecords[schedule.collectionId];
        }
        if (!records || records.length === 0) {
            Log.info(`record count is 0`);
            if (trace) {
                trace(JSON.stringify({ isResult: true }));
            }
            return;
        }
        Log.info(`run schedule ${schedule.name}`);

        schedule.lastRunDate = DateUtil.getUTCDate();
        await ScheduleService.save(schedule);

        const recordsWithoutFolder = records.filter(r => r.category === RecordCategory.record);
        const needCompare = schedule.needCompare && schedule.compareEnvironmentId;
        const originRunResults = await RecordRunner.runRecords(recordsWithoutFolder, schedule.environmentId, schedule.needOrder, schedule.recordsOrder, true, trace);
        const compareRunResults = needCompare ? await RecordRunner.runRecords(recordsWithoutFolder, schedule.compareEnvironmentId, schedule.needOrder, schedule.recordsOrder, true, trace) : [];
        const record = await this.storeRunResult(originRunResults, compareRunResults, schedule, isScheduleRun);

        if (trace) {
            trace(JSON.stringify({ isResult: true, ...record, runDate: new Date(record.runDate + ' UTC') }));
        }

        if (schedule.mailMode !== MailMode.mailWhenFail || !record.success) {
            Log.info('send mails');
            const mails = await this.getMailsByMode(schedule);
            if (!mails || mails.length === 0) {
                Log.info('no valid email');
                return;
            }
            const mailRecords = await this.getRecordInfoForMail(record, records, schedule.environmentId, schedule.compareEnvironmentId);
            if (!record.schedule.mailIncludeSuccessReq) {
                mailRecords.runResults = mailRecords.runResults.filter(r => !r.isSuccess);
            }
            await MailService.scheduleMail(mails, mailRecords);
        }
        Log.info(`run schedule finish`);
    }

    private async getMailsByMode(schedule: Schedule): Promise<string[]> {
        if (schedule.notification === NotificationMode.me) {
            const user = await UserService.getUserById(schedule.ownerId);
            return user ? [user.email] : [];
        } else if (schedule.notification === NotificationMode.project) {
            const collection = await CollectionService.getById(schedule.collectionId);
            if (!collection) {
                return [];
            }
            const project = await ProjectService.getProject(collection.project.id, false, false, true, false);
            if (!project) {
                return [];
            }
            return project.members.map(m => m.email);
        } else if (schedule.notification === NotificationMode.custom) {
            return schedule.emails.split(';');
        }
        return [];
    }

    private async getRecordInfoForMail(record: ScheduleRecord, records: Record[], originEnvId: string, compareEnvId: string) {
        const envNames = _.keyBy(await EnvironmentService.getEnvironments([originEnvId, compareEnvId]), 'id');
        const recordDict = _.keyBy(records, 'id');
        return {
            ...record,
            scheduleName: record.schedule.name,
            runResults: [...this.getRunResultForMail(record.result.origin, originEnvId, envNames, recordDict),
            ...this.getRunResultForMail(record.result.compare, compareEnvId, envNames, recordDict)]
        };
    }

    private getRunResultForMail(runResults: Array<RunResult | _.Dictionary<RunResult>>, envId: string, envNames: _.Dictionary<Environment>, recordDict: _.Dictionary<Record>) {
        const unknownEnv = 'No Environment';
        const getMailInfo = (r: RunResult) => ({ ...r, isSuccess: this.isSuccess(r), envName: envNames[envId] ? envNames[envId].name : unknownEnv, recordName: this.getRecordDisplayName(recordDict, r.id), duration: r.elapsed, parameter: r.param });
        return _.flatten(runResults.map(r => this.isRunResult(r) ? getMailInfo(r) : _.values(r).map(rst => getMailInfo(rst))));
    }

    private isRunResult(res: RunResult | _.Dictionary<RunResult>): res is RunResult {
        return (res as RunResult).id !== undefined;
    }

    private getRecordDisplayName = (recordDict: _.Dictionary<Record>, id: string) => {
        const unknownRecord = 'unknown';
        const record = recordDict[id];
        if (!record) {
            return unknownRecord;
        }
        const folder = record.pid ? recordDict[record.pid] : undefined;
        return folder ? `${folder.name}/${record.name}` : record.name;
    }

    private async storeRunResult(originRunResults: Array<RunResult | _.Dictionary<RunResult>>, compareRunResults: Array<RunResult | _.Dictionary<RunResult>>, schedule: Schedule, isScheduleRun?: boolean): Promise<ScheduleRecord> {
        const scheduleRecord = new ScheduleRecord();
        const totalRunResults = _.flatten([...originRunResults, ...compareRunResults].map(r => this.isRunResult(r) ? r : _.values(r)));

        scheduleRecord.success = totalRunResults.every(r => this.isSuccess(r)) && this.compare(originRunResults, compareRunResults, schedule);
        scheduleRecord.schedule = schedule;
        scheduleRecord.result = { origin: originRunResults, compare: compareRunResults };
        scheduleRecord.isScheduleRun = isScheduleRun;
        scheduleRecord.duration = schedule.needOrder ? totalRunResults.map(r => r.elapsed).reduce((p, a) => p + a) : _.max(totalRunResults.map(r => r.elapsed));
        scheduleRecord.runDate = schedule.lastRunDate;

        Log.info('clear redundant records');
        await ScheduleRecordService.clearRedundantRecords(schedule.id);

        Log.info('try clear record content');
        this.tryClearContent(originRunResults);
        this.tryClearContent(compareRunResults);

        Log.info('create new record');
        return await ScheduleRecordService.create(scheduleRecord);
    }

    private async tryClearContent(runResults: Array<RunResult | _.Dictionary<RunResult>>) {
        runResults.forEach(r => {
            if (this.isRunResult(r)) {
                this.clearRunResult(r);
            } else {
                _.values(r).forEach(s => {
                    this.clearRunResult(s);
                });
            }
        });
    }

    private async clearRunResult(runResult: RunResult) {
        const storeContent = Setting.instance.scheduleStoreContent;
        const isImg = ValidateUtil.isResImg(runResult.headers);
        if (isImg || storeContent === 'none' || (storeContent === 'forFail' && this.isSuccess(runResult))) {
            runResult.body = '';
            runResult.headers = {};
        }
    }

    private flattenRunResult(res: Array<RunResult | _.Dictionary<RunResult>>) {
        return _.flatten(res.map(r => this.isRunResult(r) ? r : _.values(r)));
    }

    private compare(originRunResults: Array<RunResult | _.Dictionary<RunResult>>, compareRunResults: Array<RunResult | _.Dictionary<RunResult>>, schedule: Schedule) {
        if (compareRunResults.length === 0) {
            return true;
        }
        if (originRunResults.length !== compareRunResults.length) {
            return false;
        }

        const notNeedMatchIds = schedule.recordsOrder ? schedule.recordsOrder.split(';').filter(r => r.endsWith(':0')).map(r => r.substr(0, r.length - 2)) : [];

        const compareDict = _.keyBy(this.flattenRunResult(compareRunResults), r => `${r.id}${r.param || ''}`);
        const originResults = this.flattenRunResult(originRunResults);
        for (let i = 0; i < originResults.length; i++) {
            const key = `${originResults[i].id}${originResults[i].param || ''}`;
            if (!notNeedMatchIds.some(id => id === originResults[i].id) && (!compareDict[key] || !this.compareExport(originResults[i], compareDict[key]))) {
                return false;
            }
        }

        return true;
    }

    private compareExport(originRst: RunResult, compareRst: RunResult): boolean {
        if (originRst.export !== Sandbox.defaultExport &&
            compareRst.export !== Sandbox.defaultExport) {
            return _.isEqual(originRst.export, compareRst.export);
        }
        return originRst.body === compareRst.body;
    }

    private async getAllSchedules(): Promise<Schedule[]> {
        const schedules = await ScheduleService.getAllNeedRun();
        Log.info(`root schedules length is ${schedules.length}`);
        return schedules.filter(s => ScheduleService.checkScheduleNeedRun(s));
    }

    private isSuccess(runResult: RunResult): boolean {
        const testValues = _.values(runResult.tests);
        return !runResult.error && (testValues.length === 0 || testValues.reduce((p, a) => p && a)) && runResult.status < 500;
    }
}
