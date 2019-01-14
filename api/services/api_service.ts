import { Api } from '../models/api';
import { ConnectionManager } from './connection_manager';
import { ResObject } from '../common/res_object';
import { Message } from '../common/message';
import { DtoApi } from '../interfaces/dto_api';
import { StringUtil } from '../utils/string_util';
import {RecordCategory} from "../common/record_category";
import { RecordService } from "./record_service";
import { Record } from "../models/record";
import {FormDataService} from "./form_data_service";
import {QueryStringService} from "./query_string_service";
import { Header } from "../models/header";
import {BodyFormData} from "../models/body_form_data";
import { QueryString } from "../models/query_string";
import {DtoHeader} from "../interfaces/dto_header";

export class ApiService {
	private static _sort: number = 0;

	static fromDto(target: DtoApi): Api {
		let api = new Api();
		api.id = target.id;
		api.uri = target.uri;
		api.name = target.name;
		api.method = target.method;
		api.description = target.description;
		api.isJson = target.isJson;
		api.author = target.author;
		api.keyword = target.keyword;
		api.header = target.header;
		api.param = target.param;
		return api;
	}

	private static handleArray<TTarget extends { api: Api }, TDTO>(dtos: TDTO[] | any, id: string, fromDto: (o: TDTO) => TTarget) {
		if (dtos instanceof Array) {
			return dtos.map(o => {
				let target = fromDto(o);
				return this.setApiForChild(target, id);
			});
		}
	}

	private static setApiForChild<T extends { api: Api }>(child: T, id: string) {
		child.api = new Api();
		child.api.id = id;
		return child;
	}

	static toDto(target: Api): DtoApi {
		return <DtoApi><any>{...target};
	}

	static async getById(id: string): Promise<Api> {
		const connection = await ConnectionManager.getInstance();
		let rep = connection.getRepository(Api).createQueryBuilder('api');
		return await rep.where('api.id=:id', {id: id}).getOne();
	}

	static async getChildren(): Promise<Api[]> {
		const connection = await ConnectionManager.getInstance();
		let rep = connection.getRepository(Api).createQueryBuilder('api');
		return await rep.getMany();
	}

	static async sort(recordId: string, folderId: string, collectionId: string, newSort: number): Promise<ResObject> {
		const connection = await ConnectionManager.getInstance();
		await connection.transaction(async manager => {
			await manager.query('update record r set r.sort = r.sort+1 where r.sort >= ? and r.collectionId = ? and pid = ?', [newSort, collectionId, folderId]);
			await manager.createQueryBuilder(Api, 'record')
			.where('record.id=:id', {'id': recordId})
			.update(Api, {'collectionId': collectionId, 'pid': folderId, 'sort': newSort})
			.execute();
		});
		return {success: true, message: Message.get('recordSortSuccess')};
	}

	static async save(api: DtoApi): Promise<ResObject> {
		if (!api.name) {
			return {success: false, message: Message.get('apiCreateFailedOnName')};
		}
		if (!api.description) {
			return {success: false, message: Message.get('apiCreateFailedOnDescription')};
		}
		if (!api.uri) {
			return {success: false, message: Message.get('apiCreateFailedOnUri')};
		}
		if (!api.keyword) {
			return {success: false, message: Message.get('apiCreateFailedOnKeyword')};
		}
		if (!api.method) {
			api.method = 'GET';
		}
		if (!api.id) {
			api.id = StringUtil.generateUID();
		}
		const connection = await ConnectionManager.getInstance();
		const existing = await connection.getRepository(Api).createQueryBuilder('api').where('api.id=:apiId', {apiId: api.id}).getOne();
		await connection.getRepository(Api).save(api);
		const records = await connection.getRepository(Record).createQueryBuilder('record').where('record.apiId=:apiId', {apiId: api.id}).leftJoinAndSelect('record.headers', 'header').leftJoinAndSelect('record.queryStrings', 'queryString').leftJoinAndSelect('record.formDatas', 'formData').getMany();
		const params = JSON.parse(api.param);
		const headers = JSON.parse(api.header);
		let newheader = [];
		if (records.length > 0) {
			let old = [];
			if (existing.param !== undefined && existing.param !== "") {
				old = JSON.parse(existing.param);
			}
			params.forEach(p => {
				let flag = true;
				for(let i = 0; flag && i < old.length; i++) {
					if(old[i].key === p.key) {
						p['update'] = i;
						flag = false;
					}
				}
				for(let i = 0; flag && i < old.length; i++) {
					if(old[i].value === p.value) {
						p['update'] = i;
						flag = false;
					}
				}
				if (flag) {
					p['update'] = -1;
				}
			});
			let oldheader = {};
			if (existing.header !== undefined && existing.header !== "") {
				oldheader = JSON.parse(existing.header);
			}
			Object.keys(oldheader).forEach(o => {
				let found = false;
				for(let i = 0; !found && i < Object.keys(headers).length; i++) {
					if(Object.keys(headers)[i] === o) {
						found = true;
					}
				}
				if(!found) {
					let temp = {};
					temp['key'] = o;
					temp['oldkey'] = "beingremoved";
					newheader.push(temp);
				}
			});
			Object.keys(headers).forEach(h => {
				let flag = true;
				for(let i = 0; flag && i < Object.keys(oldheader).length; i++) {
					if(Object.keys(oldheader)[i] === h) {
						flag = false;
					}
				}
				for(let i = 0; flag && i < Object.keys(oldheader).length; i++) {
					if(oldheader[Object.keys(oldheader)[i]] === headers[h]) {
						let temp = {};
						temp['key'] = h;
						temp['value'] = headers[h];
						temp['oldkey'] = Object.keys(oldheader)[i];
						newheader.push(temp);
						flag = false;
					}
				}
				if (flag) {
					let temp = {};
					temp['key'] = h;
					temp['value'] = headers[h];
					temp['oldkey'] = "";
					newheader.push(temp);
				}
			});
		}
		records.forEach((record) => {
			record.method = api.method;
			record.url = api.uri;
			if(api.isJson) {
				let target = {};
				let origin = {};
				if (record.body !== undefined && record.body !== "") {
					origin = JSON.parse(record.body);
				}
				const keys = Object.keys(origin);
				for(var i = 0; i < params.length; ++i) {
					if (params[i].update > 0) {
						target[params[i].key] = origin[keys[params[i].update]];
					} else {
						target[params[i].key] = params[i].value;
					}
				}
				record.body = JSON.stringify(target);
				record.queryStrings = [];
				record.formDatas = [];
			}else {
				record.body = "";
				let paramStrings = [];
				let originStrings = [];
				if(record.queryStrings.length > 0) {
					originStrings = record.queryStrings;
				}else if(record.formDatas.length > 0) {
					originStrings = record.formDatas;
				}
				for(var i = 0; i < params.length; ++i) {
					let query = {} as QueryString;
					query['key'] = params[i].key;
					query['id'] = StringUtil.generateUID();
					query['isFav'] = false;
					query['isActive'] = true;
					query['description'] = params[i].description;
					query['record'] = record;
					if (params[i].update > 0) {
						query['value'] = originStrings[params[i].update].value;
					} else {
						query['value'] = params[i].value;
					}
					paramStrings.push(query);
				}
				if(record.formDatas.length > 0) {
					record.formDatas = paramStrings;
					record.queryStrings = [];
				} else if (record.queryStrings.length > 0 || api.method === 'GET') {
					record.queryStrings = paramStrings;
					record.formDatas = [];
				} else {
					record.formDatas = paramStrings;
					record.queryStrings = [];
				}
			}
			let target = record.headers;
			target.forEach(t => {
				t['record'] = record;
			});
			newheader.forEach((h) => {
				let notexist = true;
				if (h.oldkey === "") {
					for(let i = 0; i < target.length; i++) {
						if (h.key === target[i].key) {
							notexist = false;
							break;
						}
					}
				} else if (h.oldkey === "beingremoved") {
					notexist = false;
					for(let i = 0; i < target.length; i++) {
						if (h.key === target[i].key) {
							target.splice(i, 1);
							break;
						}
					}
				} else {
					notexist = false;
					let hoho = true;
					for(let i = 0; i < target.length; i++) {
						if (h.key === target[i].key) {
							hoho = false;
							break;
						}
					}
					if (hoho) {
						for(let i = 0; i < target.length; i++) {
							if (h.oldkey === target[i].key) {
								target[i].key = h.key;
								break;
							}
						}
					}
				}
				if (notexist) {
					let header = {} as Header;
					header['key'] = h.key;
					header['value'] = h.value;
					header['id'] = StringUtil.generateUID();
					header['isFav'] = false;
					header['isActive'] = true;
					header['record'] = record;
					target.push(header);
				}
			});
			record.headers = target;
			RecordService.update(record);
		});
		return {success: true, message: Message.get('apiSaveSuccess')};
	}

	static async delete(id: string): Promise<ResObject> {
		const connection = await ConnectionManager.getInstance();
		await connection.transaction(async manager => {
			await manager.createQueryBuilder(Api, 'api')
			.delete()
			.where('api.id=:id', { id: id })
			.execute();
		});
		return { success: true, message: Message.get('apiDeleteSuccess') };
	}

}