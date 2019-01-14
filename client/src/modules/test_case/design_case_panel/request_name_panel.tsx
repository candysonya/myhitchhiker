import React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Form, Alert, AutoComplete } from 'antd';
import {DataMode, ValidateStatus, ValidateType} from '../../../common/custom_type';
import { actionCreator } from '../../../action/index';
import { UpdateDisplayRecordPropertyType } from '../../../action/record';
import { getActiveRecordSelector, getActiveRecordStateSelector } from './selector';
import { ConflictType } from '../../../common/conflict_type';
import { DisplayQueryStringType, ShowTimelineType } from '../../../action/ui';
import Msg from '../../../locales';
import LoInput from '../../../locales/input';
import { State } from '../../../state/index';
import { ApiState } from "../../../state/collection";
import { RecordCategory } from "../../../common/record_category";

const FItem = Form.Item;

interface RequestNamePanelStateProps {

    activeKey: string;

    id: string;

    name: string;

    description: string;

    keyword: string;

    category: RecordCategory;

    notShowConflict?: boolean;

    conflictType: ConflictType;

    allApi: _.Dictionary<Array<ApiState>>;

    apis: Array<string>;

    matchingApi: string;

}

interface RequestNamePanelDispatchProps {

    changeRecord(value: { [key: string]: any });

    showTimeLine(id: string);

	switchQueryStringDisplay(recordId: string, displayQueryString: boolean);

}

type RequestNamePanelProps = RequestNamePanelStateProps & RequestNamePanelDispatchProps;

interface RequestNamePanelState {

    nameValidateStatus?: ValidateStatus;

    apiSource: Array<string>;

}

class RequestNamePanel extends React.Component<RequestNamePanelProps, RequestNamePanelState> {

    constructor(props: RequestNamePanelProps) {
        super(props);
        this.state = {
        	apiSource: this.props.apis
        };
    }

    public componentWillReceiveProps(nextProps: RequestNamePanelProps) {
        this.setState({
            ...this.state,
            nameValidateStatus: nextProps.name.trim() === '' ? ValidateType.warning : undefined
        });
    }

    private onNameChanged = (value: string) => {
        let nameValidateStatus = this.state.nameValidateStatus;
        if ((value as string).trim() === '') {
            nameValidateStatus = ValidateType.warning;
        } else if (this.state.nameValidateStatus) {
            nameValidateStatus = undefined;
        }
        this.props.changeRecord({ 'name': value });
    }

    private onDescriptionChanged = (value: string) => {
        this.props.changeRecord({ 'description': value });
    }

	private onKeywordChanged = (value: string) => {
		this.props.changeRecord({ 'keyword': value });
	}

    private getConflictModifyMsg = () => {
        return (
            <div>
                <span>{Msg('Collection.HasModified')}</span>
                <span style={{ marginLeft: 12 }}><a onClick={() => this.props.showTimeLine(this.props.activeKey)}>{Msg('Collection.ViewChanges')}</a></span>
            </div>
        );
    }

	public searchApi = (value) => {
		this.setState({
			apiSource: !value ? this.props.apis : this.state.apiSource.filter((it) => it.toUpperCase().indexOf(value.toUpperCase()) !== -1)
		});
	}

	public apiSelected = (value) => {
    	let apiProperty = value.split(" : ");
    	let api = this.props.allApi[apiProperty[0]].filter((it) => it.name === apiProperty[1] && it.uri === apiProperty[2])[0];
    	let headers = [] as Array<string>;
    	let i = 0;
    	Object.keys(JSON.parse(api.header)).forEach((key) => {
    		let header = {};
    		header['key'] = key;
    		header['value'] = JSON.parse(api.header)[key];
    		header['sort'] = i++;
    		headers.push(JSON.stringify(header));
	    });
    	if (api.isJson) {
    		let body = {};
    		JSON.parse(api.param).forEach((it) => {
    			body[it.key] = it.value;
		    });
		    this.props.changeRecord({
			    'apiId': api.id,
			    'name': api.name,
			    'description': api.description,
			    'keyword': api.keyword,
			    'url': api.uri,
			    'method': api.method,
			    'headers': JSON.parse("[" + headers + "]"),
			    'body': JSON.stringify(body),
			    'queryStrings': '',
			    'formDatas': ''
		    });
	    } else if (api.method === 'GET') {
		    this.props.changeRecord({
			    'apiId': api.id,
			    'name': api.name,
			    'description': api.description,
			    'keyword': api.keyword,
			    'url': api.uri,
			    'method': api.method,
			    'headers': JSON.parse("[" + headers + "]"),
			    'queryStrings': JSON.parse(api.param),
			    'body': '',
			    'formDatas': ''
		    });
	    } else {
		    this.props.changeRecord({
			    'apiId': api.id,
			    'name': api.name,
			    'description': api.description,
			    'keyword': api.keyword,
			    'url': api.uri,
			    'method': api.method,
			    'headers': JSON.parse("[" + headers + "]"),
			    'queryStrings': '',
			    'formDatas': JSON.parse(api.param),
			    'dataMode': DataMode.urlencoded,
			    'body': ''
		    });
	    }
	}

    public render() {

        const { nameValidateStatus, apiSource } = this.state;
        const { name, description, keyword, category, matchingApi, notShowConflict, conflictType } = this.props;
        const currentConflictType = notShowConflict ? ConflictType.none : conflictType;
        return (
            <div>
                {
                    currentConflictType === ConflictType.delete ?
                        <Alert message={Msg('Collection.HasDelete')} type="error" showIcon={true} closable={true} /> : (
                            currentConflictType === ConflictType.modify ?
                                <Alert message={this.getConflictModifyMsg()} type="warning" showIcon={true} closable={true} /> : ''
                        )
                }
                <div>
                    <span className="req-panel">
		                {
		                	category === RecordCategory.api ? '' : (
			                <div>
				                <span>为请求关联接口：</span>
				                <AutoComplete
				                style={{width: 500}}
				                dataSource={apiSource}
				                placeholder="选择接口"
				                onSearch={this.searchApi}
				                allowClear={true}
				                onChange={this.searchApi}
				                onSelect={this.apiSelected}
				                value={matchingApi}
				                />
			                </div>
			                )
		                }
                        <Form className="req-panel-form">
                            <FItem
                                className="req-name"
                                hasFeedback={true}
                                validateStatus={nameValidateStatus}
                            >
                                <LoInput
                                    placeholderId="Collection.EnterNameForRequest"
                                    spellCheck={false}
                                    onChange={(e) => this.onNameChanged(e.currentTarget.value)}
                                    value={name}
                                />
                            </FItem>
                        </Form>
                    </span>
                </div>
	            <div className="req-panel-description" style={{ marginBottom: 8 }}>
		            <LoInput
		            placeholderId="Collection.RequestDescription"
		            spellCheck={false}
		            onChange={(e) => this.onDescriptionChanged(e.currentTarget.value)}
		            value={description}
		            type="textarea"
		            autosize={true}
		            />
		            <LoInput
		            placeholderId="Collection.RequestKeyword"
		            spellCheck={false}
		            onChange={(e) => this.onKeywordChanged(e.currentTarget.value)}
		            value={keyword}
		            type="textarea"
		            autosize={true}
		            />
	            </div>
            </div>
        );
    }
}

const mapStateToProps = (state: State): RequestNamePanelStateProps => {
    const activeRecordState = getActiveRecordStateSelector()(state);
    const activeRecord = getActiveRecordSelector()(state);
    const activeKey = state.displayRecordsState.activeKey;
    const allApi = state.apiListState.apis;
    let apis = [] as Array<string>;
	let matchingApi = "";
    Object.keys(allApi).forEach((key) => {
    	allApi[key].forEach((it) => {
    		apis.push(it.keyword + " : " + it.name + " : " + it.uri);
		    if(activeRecord.apiId !== undefined && activeRecord.apiId !== "-1" && it.id === activeRecord.apiId) {
			    matchingApi = it.keyword + " : " + it.name + " : " + it.uri;
		    }
	    })
    });
    return {
        activeKey,
        id: activeRecordState.record.id,
	    category: activeRecord.category,
        name: activeRecord.name,
        description: activeRecord.description || '',
	    keyword: activeRecord.keyword || '',
        notShowConflict: activeRecordState.notShowConflict,
        conflictType: activeRecordState.conflictType,
	    matchingApi: matchingApi,
	    allApi,
	    apis
    };
};

const mapDispatchToProps = (dispatch: Dispatch<any>): RequestNamePanelDispatchProps => {
    return {
        changeRecord: (value) => dispatch(actionCreator(UpdateDisplayRecordPropertyType, value)),
        showTimeLine: (id) => dispatch(actionCreator(ShowTimelineType, id)),
	    switchQueryStringDisplay: (recordId, displayQueryString) => dispatch(actionCreator(DisplayQueryStringType, { recordId, displayQueryString }))
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RequestNamePanel);