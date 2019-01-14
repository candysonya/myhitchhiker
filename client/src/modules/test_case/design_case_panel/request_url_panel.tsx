import React from 'react';
import { connect, Dispatch, MapStateToPropsFactory } from 'react-redux';
import { Button, Dropdown, Select, Menu, Modal, TreeSelect, message } from 'antd';
import { HttpMethod } from '../../../common/http_method';
import { getActiveRecordSelector, getActiveRecordStateSelector, getActiveEnvIdSelector, getCollectionTreeDataSelector, getActiveReqResUIStateSelector } from './selector';
import { actionCreator } from '../../../action/index';
import { SaveRecordType, SaveAsRecordType, AlreadySaveRecordType, SendRequestType, UpdateDisplayRecordType } from '../../../action/record';
import { SaveApiType } from "../../../action/api";
import { State } from '../../../state/index';
import { DtoRecord } from '../../../../../api/interfaces/dto_record';
import { newRecordFlag, allParameter } from '../../../common/constants';
import { StringUtil } from '../../../utils/string_util';
import { TreeData } from 'antd/lib/tree-select/interface';
import * as _ from 'lodash';
import { DtoHeader } from '../../../../../api/interfaces/dto_header';
import CodeSnippetDialog from '../../../components/code_snippet_dialog';
import Msg from '../../../locales';
import LoInput from '../../../locales/input';
import LocalesString from '../../../locales/string';
import { DisplayQueryStringType } from '../../../action/ui';
import { DtoQueryString, DtoBodyFormData } from '../../../../../api/interfaces/dto_variable';
import { DtoApi } from "../../../../../api/interfaces/dto_api";
import { getNewApi } from "../../../state/collection";
import { RecordCategory } from "../../../common/record_category";

const DButton = Dropdown.Button as any;
const Option = Select.Option;

interface RequestUrlPanelStateProps {

    record: DtoRecord;

    isRequesting: boolean;

    isChanged: boolean;

    environment: string;

    collectionTreeData: TreeData[];

    currentParam: string;

    displayQueryString: boolean;

    currentUser: string;

}

interface RequestUrlPanelDispatchProps {

    changeRecord(record: DtoRecord);

    saveAs(record: DtoRecord);

    save(record: DtoRecord, isNew: boolean, oldId?: string);

    saveApi(api: DtoApi);

    alreadySave(record: DtoRecord);

    sendRequest(environment: string, record: DtoRecord | _.Dictionary<DtoRecord>);

    switchQueryStringDisplay(recordId: string, displayQueryString: boolean);

}

type RequestUrlPanelProps = RequestUrlPanelStateProps & RequestUrlPanelDispatchProps;

interface RequestUrlPanelState {

    isSaveDlgOpen: boolean;

    isSaveAsDlgOpen: boolean;

    selectedFolderId?: string;

    isCodeSnippetDlgOpen: boolean;
}

class RequestUrlPanel extends React.Component<RequestUrlPanelProps, RequestUrlPanelState> {

    constructor(props: RequestUrlPanelProps) {
        super(props);
        this.state = {
            isSaveAsDlgOpen: false,
            isSaveDlgOpen: false,
            isCodeSnippetDlgOpen: false
        };
    }

    shouldComponentUpdate(nextProps: RequestUrlPanelStateProps, nextState: RequestUrlPanelState) {
        const { record, isRequesting, environment, collectionTreeData, displayQueryString } = this.props;
        return record.url !== nextProps.record.url ||
            record.method !== nextProps.record.method ||
            isRequesting !== nextProps.isRequesting ||
            environment !== nextProps.environment ||
            collectionTreeData !== nextProps.collectionTreeData ||
            displayQueryString !== nextProps.displayQueryString ||
            !_.isEqual(record.queryStrings, nextProps.record.queryStrings) ||
            !_.isEqual(this.state, nextState) || record.category !== nextProps.record.category;
    }

    private getMethods = (defaultValue?: string) => {
        const value = (defaultValue || HttpMethod.GET).toUpperCase();
        const { changeRecord } = this.props;
        return (
            <Select value={value} dropdownMenuStyle={{ maxHeight: 300 }} onChange={e => changeRecord({ ...this.props.record, method: e.toString() })} style={{ width: 100 }}>
                {
                    Object.keys(HttpMethod).map(k =>
                        <Option key={k} value={k}>{k}</Option>)
                }
            </Select>
        );
    }

    private canSave = () => {
        if (this.props.record.name.trim() !== '') {
            return true;
        }
        message.warning(LocalesString.get('Collection.MissName'), 3);
        return false;
    }

    private onClick = (e) => {
        this[e.key]();
    }

    saveAs = () => {
        if (this.canSave()) {
            this.setState({ ...this.state, isSaveAsDlgOpen: true });
        }
    }

	async generateFieldRecords() {
		let {...rawrecord} = this.props.record;
		rawrecord.category = RecordCategory.record;
		rawrecord.collectionId = "3b5918d0-08ad-11e9-a9e0-57831288e935-Hk6nuUeW4";
		(rawrecord.headers || []).forEach(h => {
			h.id = StringUtil.generateUID();
			h.isFav = false;
		});
		let name = rawrecord.name;
		let query = rawrecord.queryStrings || [];
		for (let i = 0; i < query.length; ++i){
			let {...record1} = rawrecord;
			let {...record2} = rawrecord;
			let [...temp1] = query;
			let [...temp2] = query;
			for(let j = 0; j < query.length; ++j) {
				let {...tempjson1} = query[j];
				let {...tempjson2} = query[j];
				tempjson1.id = StringUtil.generateUID();
				tempjson2.id = StringUtil.generateUID();
				temp1[j] = tempjson1;
				temp2[j] = tempjson2;
			}
			record1.id = StringUtil.generateUID();
			record1.name = name + "_空值" + query[i].key;
			delete temp1[i].value;
			record1.queryStrings = temp1;
			record1.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
			this.props.saveAs(record1);
			record2.id = StringUtil.generateUID();
			record2.name = name + "_不传" + query[i].key;
			temp2.splice(i, 1);
			record2.queryStrings = temp2;
			record2.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
			this.props.saveAs(record2);
		}
		let form = rawrecord.formDatas || [];
		for (let i = 0; i < form.length; ++i) {
			let {...record1} = rawrecord;
			let {...record2} = rawrecord;
			let [...temp1] = form;
			let [...temp2] = form;
			for(let j = 0; j < form.length; ++j) {
				let {...tempjson1} = form[j];
				let {...tempjson2} = form[j];
				tempjson1.id = StringUtil.generateUID();
				tempjson2.id = StringUtil.generateUID();
				temp1[j] = tempjson1;
				temp2[j] = tempjson2;
			}
			record1.id = StringUtil.generateUID();
			record1.name = name + "_空值" + form[i].key;
			delete temp1[i].value;
			record1.formDatas = temp1;
			record1.apiId = "-1";
			record1.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
			this.props.saveAs(record1);
			record2.id = StringUtil.generateUID();
			record2.name = name + "_不传" + form[i].key;
			temp2.splice(i,1);
			record2.formDatas = temp2;
			record2.apiId = "-1";
			record2.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
			this.props.saveAs(record2);
		}
		let body = JSON.parse(rawrecord.body || "{}");
		for (let i = 0; i < _.keys(body).length; ++i) {
			let {...record1} = rawrecord;
			let {...temp} = body;
			record1.id = StringUtil.generateUID();
			record1.name = name + "_空值" + _.keys(body)[i];
			temp[_.keys(body)[i]] = "";
			record1.body = JSON.stringify(temp);
			record1.apiId = "-1";
			record1.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
			this.props.saveAs(record1);
			let {...record2} = rawrecord;
			record2.id = StringUtil.generateUID();
			record2.name = name + "_不传" + _.keys(body)[i];
			delete temp[_.keys(body)[i]];
			record2.body = JSON.stringify(temp);
			record2.apiId = "-1";
			record2.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
			this.props.saveAs(record2);
		}
	}

	async generateValueRecords() {
		let {...rawrecord} = this.props.record;
		rawrecord.category = RecordCategory.record;
		rawrecord.collectionId = "3b5918d0-08ad-11e9-a9e0-57831288e935-Hk6nuUeW4";
		(rawrecord.headers || []).forEach(h => {
			h.id = StringUtil.generateUID();
			h.isFav = false;
		});
		let name = rawrecord.name;
		let query = rawrecord.queryStrings || [];
		for (let i = 0; i < query.length; ++i){
			let params = (query[i].value || "").split(";");
			let start = 1;
			if(i == 0) {
				start = 0;
			}
			for(let k = start; k < params.length; ++k) {
				let {...record} = rawrecord;
				let [...temp] = query;
				for (let j = 0; j < query.length; ++j) {
					let {...tempjson} = query[j];
					tempjson.id = StringUtil.generateUID();
					if (j == i) {
						tempjson.value = params[k];
					} else if((tempjson.value || "").indexOf(";") > -1) {
						tempjson.value = (tempjson.value || "").split(";")[0];
					}
					temp[j] = tempjson;
				}
				record.id = StringUtil.generateUID();
				record.name = name + "_传值" + query[i].key + "=" + params[k];
				record.queryStrings = temp;
				record.apiId = "-1";
				record.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
				this.props.saveAs(record);
			}
		}
		let form = rawrecord.formDatas || [];
		for (let i = 0; i < form.length; ++i){
			let params = (form[i].value || "").split(";");
			let start = 1;
			if(i == 0) {
				start = 0;
			}
			for(let k = start; k < params.length; ++k) {
				let {...record} = rawrecord;
				let [...temp] = form;
				for (let j = 0; j < form.length; ++j) {
					let {...tempjson} = form[j];
					tempjson.id = StringUtil.generateUID();
					if (j == i) {
						tempjson.value = params[k];
					} else if((tempjson.value || "").indexOf(";") > -1) {
						tempjson.value = (tempjson.value || "").split(";")[0];
					}
					temp[j] = tempjson;
				}
				record.id = StringUtil.generateUID();
				record.name = name + "_传值" + form[i].key + "=" + params[k];
				record.formDatas = temp;
				record.apiId = "-1";
				record.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
				this.props.saveAs(record);
			}
		}
		let body = JSON.parse(rawrecord.body || "{}");
		for (let i = 0; i < _.keys(body).length; ++i) {
			let params = body[_.keys(body)[i]].toString().split(";");
			let start = 1;
			if(i == 0) {
				start = 0;
			}
			for(let k = start; k < params.length; ++k) {
				let {...record} = rawrecord;
				let {...temp} = body;
				for (let j = 0; j < _.keys(body).length; ++j) {
					if (j == i) {
						temp[_.keys(body)[j]] = params[k];
					} else if(temp[_.keys(body)[j]].toString().indexOf(";") > -1) {
						temp[_.keys(body)[j]] = temp[_.keys(body)[j]].toString().split(";")[0];
					}
				}
				record.id = StringUtil.generateUID();
				record.name = name + "_传值" + _.keys(body)[i] + "=" + params[k];
				record.body = JSON.stringify(temp);
				record.apiId = "-1";
				record.test = "tests[\"status code is 200\"] = responseCode.code === 200;";
				this.props.saveAs(record);
			}
		}
	}

	private addToApiLibrary = () => {
		let record = this.props.record;
		let newApi = getNewApi();
		if (record.apiId === '-1') {
			newApi.author = this.props.currentUser;
			record.apiId = newApi.id;
		}else {
			newApi.id = record.apiId || this.props.currentUser;
		}
		newApi.name = record.name;
		newApi.description = record.description || '';
		newApi.method = record.method || 'GET';
		newApi.keyword = record.keyword || '';
		newApi.uri = record.url || '';
		let params = [] as string[];
		(record.queryStrings || []).forEach(q => {
			let param = {};
			param['key'] = q.key;
			param['value'] = q.value;
			param['description'] = q.description;
			param['type'] = 'string';
			params.push(JSON.stringify(param));
		});
		(record.formDatas || []).forEach(q => {
			let param = {};
			param['key'] = q.key;
			param['value'] = q.value;
			param['description'] = q.description;
			param['type'] = 'string';
			params.push(JSON.stringify(param));
		});
		newApi.param = "[" + params + "]";
		let header = {};
		(record.headers || []).forEach(h => {
			if(h.key !== undefined) {
				header[h.key] = h.value;
				if (h.key === 'Accept' && h.value === 'application/json') {
					newApi.isJson = true;
				}
			}
		});
		newApi.header = JSON.stringify(header);
		if (!record.body || record.body.length === 0) {
			newApi.isJson = false;
		}else {
			newApi.isJson = true;
			_.keys(JSON.parse(record.body)).forEach(k => {
				let param = {};
				param['key'] = k;
				param['value'] = JSON.parse(record.body || "{}")[k];
				param['type'] = 'string';
				params.push(JSON.stringify(param));
			});
			newApi.param = "[" + params + "]";
		}
		this.props.saveApi(newApi);
		this.props.alreadySave(record);
    }

    codeSnippet = () => {
        this.setState({ ...this.state, isCodeSnippetDlgOpen: true });
    }

    private onSave = () => {
        if (this.canSave()) {
            const { record } = this.props;
            if (record.id.startsWith(newRecordFlag)) {
                this.setState({ ...this.state, isSaveDlgOpen: true });
            } else if (this.props.isChanged) {
                this.props.save(record, false);
            }
        }
    }

    private onSaveNew = (e) => {
        if (!this.state.selectedFolderId) {
            return;
        }
        let record = this.props.record;
        [record.collectionId, record.pid] = this.state.selectedFolderId.split('::');

        const oldRecordId = record.id;
        if (this.state.isSaveAsDlgOpen) {
            record = _.cloneDeep(record);
            record.id = StringUtil.generateUID();
            (record.headers || []).forEach(h => {
                h.id = StringUtil.generateUID();
                h.isFav = false;
            });
            (record.queryStrings || []).forEach(q => q.id = StringUtil.generateUID());
            (record.formDatas || []).forEach(f => f.id = StringUtil.generateUID());
            this.props.saveAs(record);
            this.setState({ ...this.state, isSaveAsDlgOpen: false });
        } else {
            if (oldRecordId.startsWith(newRecordFlag)) {
                record.id = StringUtil.generateUID();
            }
            this.props.save(record, true, oldRecordId);
            this.setState({ ...this.state, isSaveDlgOpen: false });
        }
    }

    private sendRequest = () => {
        const { record, environment } = this.props;
        this.props.sendRequest(environment, this.applyAllVariables({
            ...record,
            headers: [...record.headers || []],
            queryStrings: [...record.queryStrings || []],
            formDatas: [...record.formDatas || []]
        }));
    }

    private applyAllVariables: (record: DtoRecord) => DtoRecord | _.Dictionary<DtoRecord> = (record: DtoRecord) => {
        const { parameters, parameterType, reduceAlgorithm } = record;
        const { currParam, paramArr } = StringUtil.parseParameters(parameters, parameterType, this.props.currentParam, reduceAlgorithm);
        if (paramArr.length === 0) {
            return record;
        }
        const rst: _.Dictionary<DtoRecord> = {};
        const applyVars = p => this.applyReqParameterToRecord(record, p);
        if (currParam === allParameter) {
            paramArr.forEach(p => rst[JSON.stringify(p)] = applyVars(p));
        } else {
            rst[JSON.stringify(currParam)] = applyVars(currParam);
        }
        return rst;
    }

    private applyReqParameterToRecord = (record: DtoRecord, parameter: any) => {
        return {
            ...record,
            url: this.applyVariables(record.url, parameter),
            headers: this.applyVariablesToDtoHeaders(record.headers || [], parameter),
            queryStrings: this.applyVariablesToDtoHeaders(record.queryStrings || [], parameter) as DtoQueryString[],
            formDatas: this.applyVariablesToDtoHeaders(record.formDatas || [], parameter) as DtoBodyFormData[],
            body: this.applyVariables(record.body, parameter),
            test: this.applyVariables(record.test, parameter),
            prescript: this.applyVariables(record.prescript, parameter)
        };
    }

    private applyVariablesToDtoHeaders(headers: DtoHeader[], parameter: any) {
        return (headers || []).map(header => ({
            ...header,
            key: this.applyVariables(header.key, parameter),
            value: this.applyVariables(header.value, parameter)
        }));
    }

    private applyVariables = (content: string | undefined, variables: any) => {
        if (!variables || !content) {
            return content;
        }
        let newContent = content;
        _.keys(variables).forEach(k => {
            newContent = newContent.replace(new RegExp(`{{${k}}}`, 'g'), variables[k] == null ? '' : variables[k]);
        });
        return newContent;
    }

    private onUrlChanged = (urlPath: string) => {
        const record = this.props.record;
        const queryStrings = _.keyBy((record.queryStrings || []), 'key');
        const { url, querys } = StringUtil.parseUrl(urlPath);
        let newQueryStrings = querys.map((q, i) => {
            const nq = ({ ...(queryStrings[q.key] != null ? queryStrings[q.key] : { id: StringUtil.generateUID(), key: q.key }), value: q.value, sort: i, isActive: true });
            if (queryStrings[q.key] != null) {
                delete queryStrings[q.key];
            }
            return nq;
        });

        let needResort = false;
        Object.keys(queryStrings).forEach(k => {
            if (!queryStrings[k].isActive) {
                let index = (record.queryStrings || []).findIndex(r => r.id === queryStrings[k].id);
                if (index >= 0) {
                    needResort = true;
                    index = index > newQueryStrings.length ? newQueryStrings.length : index;
                    newQueryStrings.splice(index, 0, { ...queryStrings[k], value: queryStrings[k].value || '', sort: index, isActive: false });
                }
            }
        });
        if (needResort) {
            newQueryStrings = newQueryStrings.map((q, i) => ({ ...q, sort: i }));
        }
        this.props.changeRecord({ ...record, url, queryStrings: newQueryStrings });
    }

    public render() {

        const { record, isRequesting, collectionTreeData, switchQueryStringDisplay, displayQueryString } = this.props;

        const menu = (
            <Menu onClick={this.onClick}>
                <Menu.Item key="saveAs">{Msg('Common.SaveAs')}</Menu.Item>
                <Menu.Item key="codeSnippet">{Msg('Collection.GenerateCodeSnippet')}</Menu.Item>
            </Menu>
        );

	    const apimenu = (
	        <Menu onClick={this.onClick}>
		        <Menu.Item key="generateFieldRecords">{Msg('Common.GenerateFieldRecords')}</Menu.Item>
		        <Menu.Item key="generateValueRecords">{Msg('Common.GenerateValueRecords')}</Menu.Item>
	        </Menu>
	    );

        return (
            <div className="ant-form-inline url-panel">
                <div className="ant-row ant-form-item req-url">
                    <LoInput
                        placeholderId="Collection.EnterUrlForRequest"
                        size="large"
                        spellCheck={false}
                        onChange={(e) => this.onUrlChanged(e.currentTarget.value)}
                        addonBefore={this.getMethods(record.method)}
                        addonAfter={<Button style={{ height: 32, border: 0, color: '#888888' }} ghost={true} onClick={() => switchQueryStringDisplay(record.id, !displayQueryString)}>Param</Button>}
                        value={StringUtil.stringifyUrl(record.url || '', record.queryStrings || [])}
                    />
                </div>
                <div className="ant-row ant-form-item req-send">
                    <Button type="primary" icon="rocket" loading={isRequesting} onClick={this.sendRequest}>
                        {Msg('Common.Send')}
                    </Button>
                </div>
                <div className="ant-row ant-form-item req-save" style={{ marginRight: 0 }}>
	                {
		                record.category === RecordCategory.api ? (
		                <DButton overlay={apimenu} onClick={this.addToApiLibrary}>
			                {Msg('Common.Save')}
		                </DButton>
		                ) : (
		                <DButton overlay={menu} onClick={this.onSave}>
			                {Msg('Common.Save')}
		                </DButton>
		                )
	                }
                </div>
	            <Modal
	                title={Msg('Common.Save')}
	                visible={this.state.isSaveDlgOpen || this.state.isSaveAsDlgOpen}
	                onOk={this.onSaveNew}
	                onCancel={() => this.setState({ ...this.state, isSaveDlgOpen: false, isSaveAsDlgOpen: false })}
	            >
		            <div style={{ marginBottom: '8px' }}>{Msg('Collection.Select')}</div>
		            <TreeSelect
		            allowClear={true}
		            style={{ width: '100%' }}
		            dropdownStyle={{ maxHeight: 500, overflow: 'auto' }}
		            placeholder={LocalesString.get('Collection.SelectCollectionFolder')}
		            treeDefaultExpandAll={true}
		            value={this.state.selectedFolderId}
		            onChange={(e) => this.setState({ ...this.state, selectedFolderId: e })}
		            treeData={collectionTreeData}
		            />
	            </Modal>
                <CodeSnippetDialog
                    record={record}
                    isOpen={this.state.isCodeSnippetDlgOpen}
                    onCancel={() => this.setState({ ...this.state, isCodeSnippetDlgOpen: false })}
                />
            </div>
        );
    }
}

const makeMapStateToProps: MapStateToPropsFactory<any, any> = (initialState: any, ownProps: any) => {
    const getRecordState = getActiveRecordStateSelector();
    const getActiveEnvId = getActiveEnvIdSelector();
    const getActiveRecord = getActiveRecordSelector();
    const getTreeData = getCollectionTreeDataSelector();
    const getUIState = getActiveReqResUIStateSelector();
    const mapStateToProps: (state: State) => RequestUrlPanelStateProps = state => {
        const recordState = getRecordState(state);
        let displayParam = getUIState(state).displayQueryString;
        if ((getActiveRecord(state).queryStrings || []).length > 0) {
        	displayParam = true;
        }
        return {
            isRequesting: !!recordState && recordState.isRequesting,
            isChanged: !!recordState && recordState.isChanged,
            environment: getActiveEnvId(state),
            record: getActiveRecord(state),
            collectionTreeData: getTreeData(state),
            currentParam: recordState ? recordState.parameter : allParameter,
            displayQueryString: getUIState(state).displayQueryString,
	        currentUser: state.userState.userInfo.name
        };
    };
    return mapStateToProps;
};

const mapDispatchToProps = (dispatch: Dispatch<any>): RequestUrlPanelDispatchProps => {
    return {
        changeRecord: (record) => dispatch(actionCreator(UpdateDisplayRecordType, record)),
        save: (record, isNew, oldId) => dispatch(actionCreator(SaveRecordType, { isNew, record, oldId })),
        saveAs: (record) => dispatch(actionCreator(SaveAsRecordType, { isNew: true, record })),
	    saveApi: (api) => dispatch(actionCreator(SaveApiType, { api })),
	    alreadySave: (record) => dispatch(actionCreator(AlreadySaveRecordType, { record })),
        sendRequest: (environment, record) => dispatch(actionCreator(SendRequestType, { environment, record })),
        switchQueryStringDisplay: (recordId, displayQueryString) => dispatch(actionCreator(DisplayQueryStringType, { recordId, displayQueryString })),
    };
};

export default connect(
    makeMapStateToProps,
    mapDispatchToProps,
)(RequestUrlPanel);