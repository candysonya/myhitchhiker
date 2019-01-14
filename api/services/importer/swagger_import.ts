import { RequestsImport } from '../base/request_import';
import { Record } from '../../models/record';
import * as _ from 'lodash';
import { StringUtil } from '../../utils/string_util';
import { Collection } from '../../models/collection';
import { RecordCategory } from '../../common/record_category';
import { RecordService } from '../record_service';
import { ParameterType } from '../../common/parameter_type';
import { DtoHeader } from '../../interfaces/dto_header';
import { HeaderService } from '../header_service';
import { Header } from '../../models/header';
import { User } from '../../models/user';
import { CollectionService } from '../collection_service';
import { ProjectService } from '../project_service';
import { DtoCollection } from '../../interfaces/dto_collection';
import { DtoBodyFormData } from '../../interfaces/dto_variable';
import { DataMode } from '../../common/data_mode';
import { Environment } from '../../models/environment';
import { VariableService } from '../variable_service';
import { EnvironmentService } from '../environment_service';

export class SwaggerImport implements RequestsImport {

    baseUrl: string;

    async import(swaggerData: any, projectId: string, user: User): Promise<void> {
        const env = this.createEnv(projectId, `${swaggerData.host}${swaggerData.basePath}`);
        this.baseUrl = '{{host}}';
        let sort = await RecordService.getMaxSort();
        const dtoCollection: DtoCollection = {
            name: swaggerData.info.title,
            commonPreScript: '',
            commonSetting: { prescript: '', test: '', headers: [] },
            projectId: projectId,
            id: StringUtil.generateUID(),
            description: swaggerData.info.description
        };

        const collection = CollectionService.fromDto(dtoCollection);
        collection.owner = user;
        collection.project = ProjectService.create(projectId);
        collection.records = this.createRecords(swaggerData, collection.id, sort);

        await CollectionService.save(collection);

        await Promise.all(collection.records.map(r => RecordService.saveRecordHistory(RecordService.createRecordHistory(r, user))));

        await EnvironmentService.save(env);
    }

    private createEnv(projectId: string, host: string): Environment {
        const env = new Environment();
        env.name = 'swagger env';
        env.id = StringUtil.generateUID();
        env.variables = [];
        env.project = ProjectService.create(projectId);

        const variable = VariableService.fromDto({
            id: StringUtil.generateUID(),
            key: 'host',
            value: host,
            isActive: true,
            sort: 0
        });
        variable.environment = env;
        env.variables.push(variable);
        return env;
    }

    private createRecords(swaggerData: any, collectionId: string, sort: number): Record[] {
        const folders: _.Dictionary<Record> = {};
        const records: Record[] = [];
        _.keys(swaggerData.paths).forEach(path => {
            let pathName = path.substr(1);
            if (pathName.includes('/')) {
                pathName = pathName.substr(0, pathName.indexOf('/'));
            }
            if (!folders[pathName]) {
                folders[pathName] = this.createFolder(pathName, collectionId, ++sort);
                records.push(folders[pathName]);
            }

            const folderRecords = this.createRecordsForFolder(path, swaggerData.paths[path], swaggerData.schemes, folders[pathName].id, collectionId, sort);
            sort += folderRecords.length + 1;
            records.push(...folderRecords);
        });
        return records;
    }

    private createFolder(name: string, collectionId: string, sort: number): Record {
        return RecordService.fromDto({
            id: StringUtil.generateUID(),
            name,
            collectionId,
            category: RecordCategory.folder,
            parameterType: ParameterType.ManyToMany,
            sort
        });
    }

    private createRecordsForFolder(path: string, methodDatas: any, schemes: any, folderId: string, collectionId: string, sort: number): Record[] {
        return _.keys(methodDatas).map(method => {
            const methodData = methodDatas[method];
            const formData = this.parseFormData(methodData);
            return RecordService.fromDto({
                id: StringUtil.generateUID(),
                name: methodData.summary || methodData.operationId || '',
                collectionId,
                pid: folderId,
                category: RecordCategory.record,
                parameterType: ParameterType.ManyToMany,
                url: this.parseUrl(path, methodData, schemes),
                method: method.toUpperCase(),
                headers: this.parseHeaders(methodData),
                formDatas: formData,
                dataMode: formData.length > 0 ? DataMode.urlencoded : DataMode.raw,
                sort: ++sort
            });
        });
    }

    private parseUrl(path: string, methodData: any, schemes: any): string {
        path = path.replace('{', ':').replace('}', '');
        let url = `${(schemes || []).length > 0 ? schemes[0] : 'http'}://${this.baseUrl}${path}`;

        if (methodData.parameters) {
            methodData.parameters.filter(p => p.in === 'query').forEach(p => {
                url = `${url}${url.includes('?') ? '&' : '?'}${p.name}={{${p.name}}}`;
            });
        }

        return url;
    }

    private parseFormData(methodData: any): DtoBodyFormData[] {
        let formDatas: DtoBodyFormData[] = [];
        if (methodData.parameters) {
            methodData.parameters.filter(p => p.in === 'formData').forEach((p, i) => {
                formDatas.push({ id: undefined, key: p.name, value: `{{${p.name}}`, description: p.description, isActive: true, sort: i });
            });
        }
        return formDatas;
    }

    private parseHeaders(methodData: any): Header[] {
        const headers: DtoHeader[] = [];
        let sort = 0;
        if (methodData.consumes) {
            headers.push({ key: 'Content-Type', value: methodData.consumes[0], isActive: true, sort: ++sort });
        }
        if (methodData.produces) {
            headers.push({ key: 'Accept', value: methodData.produces.join(', '), isActive: true, sort: ++sort });
        }
        if (methodData.parameters) {
            methodData.parameters.filter(p => p.in === 'header').forEach((h, i) => {
                headers.push({ key: h.name, value: `{{${h.name}}}`, description: h.description, isActive: true, sort: i + sort + 1 });
            });
        }
        return headers.map(h => HeaderService.fromDto(h));
    }
}