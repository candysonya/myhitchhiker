import LocalesString from '../locales/string';

export type ValidateStatus = 'success' | 'warning' | 'error' | 'validating';

export class ValidateType {

    static success: ValidateStatus = 'success';

    static warning: ValidateStatus = 'warning';

    static error: ValidateStatus = 'error';

    static validating: ValidateStatus = 'validating';
}

export type KeyValueEditMode = 'Key Value Edit' | 'Bulk Edit' | '键值对编辑' | '批量编辑';

export class KeyValueEditType {

    static keyValueEdit: KeyValueEditMode = LocalesString.get('Common.KeyValueEdit');

    static bulkEdit: KeyValueEditMode = LocalesString.get('Common.BulkEdit');

    static isBulkEdit(mode: KeyValueEditMode): boolean {
        return mode === KeyValueEditType.bulkEdit;
    }

    static getReverseMode(mode: KeyValueEditMode): KeyValueEditMode {
        return KeyValueEditType.isBulkEdit(mode) ? KeyValueEditType.keyValueEdit : KeyValueEditType.bulkEdit;
    }
}

export type ProjectSelectedDialogMode = 'share' | 'create';

export class ProjectSelectedDialogType {

    static share: ProjectSelectedDialogMode = 'share';

    static create: ProjectSelectedDialogMode = 'create';

    static getTitle(mode: ProjectSelectedDialogMode): string {
        return ProjectSelectedDialogType.isCreateMode(mode) ? LocalesString.get('Collection.CreateNew') : 'Share collection';
    }

    static getDescription(mode: ProjectSelectedDialogMode): string {
        return ProjectSelectedDialogType.isCreateMode(mode) ? LocalesString.get('Collection.SelectProjectForCollection') : 'Share to project:';
    }

    static isCreateMode(mode: ProjectSelectedDialogMode): boolean {
        return mode === ProjectSelectedDialogType.create;
    }
}

export type LoginPageMode = 'login' | 'register' | 'findPassword';

export type DiffMode = 'chars' | 'words' | 'lines' | 'json' | 'none';

export class DiffType {

    static none: DiffMode = 'none';

    static chars: DiffMode = 'chars';

    static words: DiffMode = 'words';

    static lines: DiffMode = 'lines';

    static json: DiffMode = 'json';
}

export type ProjectFileType = 'lib' | 'data';

export class ProjectFileTypes {

    static lib: ProjectFileType = 'lib';

    static data: ProjectFileType = 'data';
}

export type ScheduleRecordsDisplayMode = 'normal' | 'statistics';

export class ScheduleRecordsDisplayType {

    static normal: ScheduleRecordsDisplayMode = 'normal';

    static statistics: ScheduleRecordsDisplayMode = 'statistics';
}

export enum DataMode {

    urlencoded = 0,

    raw = 1,

    form = 2,

    binary = 3
}

export enum CloseAction {

    none = 0,

    exceptActived = 1,

    saved = 2,

    all = 3
}