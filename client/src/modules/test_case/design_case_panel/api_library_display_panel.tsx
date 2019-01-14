import React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Input, Select, Collapse, Card, Button } from 'antd';
import './style/index.less';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { State } from '../../../state/index';
import { ApiState } from '../../../state/collection';
import Msg from '../../../locales';
import * as _ from 'lodash';
import { actionCreator } from '../../../action';
import { ApiFilterType, ApiSearchType, GetAllApiType, DeleteApiType } from '../../../action/api';
import { AddApiTabType, TriggerTabType, UpdateDisplayRecordPropertyType } from "../../../action/record";
import { DataMode } from '../../../common/custom_type';
//import ApiListItem from './api_list_item';

const Option = Select.Option;
const Panel = Collapse.Panel;
const ButtonGroup = Button.Group;

interface ApiLibraryDisplayPanelStateProps {

	apis: _.Dictionary<Array<ApiState>>;

	filter: string;

	search: string;

}

interface ApiLibraryDisplayPanelDispatchProps {

	getAllApi();

	onSearch(event: React.FormEvent<HTMLInputElement>);

	onFilter(value: string);

	triggerTab(value: string);

	changeRecord(value: { [key: string]: any });

	addApiTab(value?: string);

	deleteApi(value: string);

}

type ApiLibraryDisplayPanelProps = ApiLibraryDisplayPanelStateProps & ApiLibraryDisplayPanelDispatchProps;

interface ApiLibraryDisplayPanelState {
}


class ApiLibraryDisplayPanel extends React.Component<ApiLibraryDisplayPanelProps, ApiLibraryDisplayPanelState> {

	constructor(props: ApiLibraryDisplayPanelProps) {
		super(props);
	}

	private modifyApi = (api) => {
		this.props.addApiTab(api.id);
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
				'queryString': '',
				'formDatas': ''
			});
		} else if(api.method === 'GET') {
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

	private createRequest = (api) => {
		this.props.triggerTab(api.id);
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
				'queryString': '',
				'formDatas': ''
			});
		} else if(api.method === 'GET') {
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
		const {apis, search, filter, addApiTab, deleteApi} = this.props;
		if (_.keys(apis).length === 0) {
			return (
			<div className="res-non-content">
				<p>
					<Button type='primary' icon='plus' onClick={() => this.props.addApiTab()} ghost>添加接口</Button>
				</p>
				<p>
					{Msg('Collection.EmptyApiLibrary')}
				</p>
			</div>
			)
		}
		return (
		<div>
			<Input placeholder='搜索URI' onChange={this.props.onSearch} defaultValue={search} style={{width: 220}}/>
			<Select defaultValue={filter} onChange={this.props.onFilter} style={{width: 220, margin: '0 20px'}}>
				<Option key='default' value='all'>选择关键词</Option>
				{
					_.keys(apis).map((key) => (
					<Option key={key} value={key}>
						{key}
					</Option>
					))
				}
			</Select>
			<Button type='primary' icon='plus' onClick={() => addApiTab()} ghost>添加接口</Button>
			<PerfectScrollbar>
				{
					_.keys(apis).filter((it) => ((filter === 'all' || filter === it) && apis[it].filter((t) => t.uri.toLowerCase().indexOf(search) > -1).length > 0)).map((key) => (
					<div key={key}>
						<h3 style={{margin: 16}}>{key}</h3>
						<Collapse bordered={true}>
							{
								apis[key].filter((it) => (it.uri.toLowerCase().indexOf(search) > -1)).map((it) => (
								<Panel key={it.id} header={
									<div>
										<span>{it.method} {it.uri} {it.name}</span>
									</div>
								}>
									<ButtonGroup style={{margin: '0 0 20px 0'}}>
										<Button type='primary' icon='plus-circle' onClick={() => this.createRequest(it)} ghost>创建请求</Button>
										<Button type='primary' icon='edit' onClick={() => this.modifyApi(it)} ghost>修改接口</Button>
										<Button type='primary' icon='delete' onClick={() => deleteApi(it.id)} ghost>删除接口</Button>
									</ButtonGroup>
									<Card title='接口介绍' style={{"align": 'center'}}>
										<p>作者：{it.author}</p>
										<p>{it.description}</p>
									</Card>
									<Card title='入参' style={{"align": 'center'}}>
										{
											it.param != null && it.param !== "" && it.param !== "[]" && Array.isArray(JSON.parse(it.param)) ? (
											<table  style={{"width":'100%'}}>
												<tbody>
												<tr>
													<th style={{"width":'20%',"align": 'center'}}>参数名</th>
													<th style={{"width":'20%',"align": 'center'}}>示例值</th>
													<th style={{"width":'20%',"align": 'center'}}>类型</th>
													<th style={{"width":'40%',"align": 'center'}}>描述</th>
												</tr>
												{
													JSON.parse(it.param).map((itt) => (
													<tr key={itt.key}>
														<td style={{"width":'20%',"textAlign": 'center'}}>{itt.key}</td>
														<td style={{"width":'20%',"textAlign": 'center'}}>{itt.value}</td>
														<td style={{"width":'20%',"textAlign": 'center'}}>{itt.type}</td>
														<td style={{"width":'40%',"textAlign": 'center'}}>{itt.description}</td>
													</tr>
													))
												}
												</tbody>
											</table>
											) : (
											<p>没有入参</p>
											)
										}
									</Card>
									<Card title='请求头' style={{"align": 'center'}}>
										{
											it.header != null && it.header !== "" && it.header !== "{}" ? (
											<table  style={{"width":'50%'}}>
												<tbody>
												<tr>
													<th style={{"width":'50%',"align": 'center'}}>名称</th>
													<th style={{"width":'50%',"align": 'center'}}>值</th>
												</tr>
												{
													_.keys(JSON.parse(it.header)).map((kkey) => (
													<tr key={kkey}>
														<td style={{"width":'50%',"textAlign": 'center'}}>{kkey}</td>
														<td style={{"width":'50%',"textAlign": 'center'}}>{JSON.parse(it.header)[kkey]}</td>
													</tr>
													))
												}
												</tbody>
											</table>
											) : (
											<p>没有指定请求头</p>
											)
										}
									</Card>
								</Panel>
								))
							}
						</Collapse>
					</div>
					))
				}
			</PerfectScrollbar>
		</div>
		);
	}

	public componentDidMount() {
		this.props.getAllApi();
	}

}
const mapStateToProps = (state: State): ApiLibraryDisplayPanelStateProps => {

	const { apis, filter, search } = state.apiListState;
    return {
        apis,
	    filter,
	    search
    };

};

const mapDispatchToProps = (dispatch: Dispatch<any>): ApiLibraryDisplayPanelDispatchProps => {
    return {
	    getAllApi: () => dispatch(actionCreator(GetAllApiType)),
		onSearch: (event) => dispatch(actionCreator(ApiSearchType, event.currentTarget.value.trim().toLowerCase())),
		onFilter: (value) => dispatch(actionCreator(ApiFilterType, value.trim().toLowerCase())),
	    triggerTab: (value) => dispatch(actionCreator(TriggerTabType, value)),
	    changeRecord: (value) => dispatch(actionCreator(UpdateDisplayRecordPropertyType, value)),
	    addApiTab: (value) => dispatch(actionCreator(AddApiTabType, value)),
	    deleteApi: (value) => dispatch(actionCreator(DeleteApiType, value))
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ApiLibraryDisplayPanel);