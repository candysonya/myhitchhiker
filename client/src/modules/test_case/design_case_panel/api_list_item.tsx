import React from 'react';
import { connect, Dispatch } from 'react-redux';
import {  } from 'antd';
import './style/index.less';
import { ApiState } from '../../../state/collection';
import {State} from "../../../state";

interface OwnProps {

	apiState: ApiState;

}


interface ApiListItemStateProps {

}

interface ApiListItemDispatchProps {

}

//type ApiListItemProps = ApiListItemStateProps & ApiListItemDispatchProps;

interface ApiListItemState {

	collapse: boolean;

}

class ApiListItem extends React.Component<OwnProps, ApiListItemState> {

	constructor(props: OwnProps) {
		super(props);
		this.state = {
			collapse : true
		};
	}


    public render() {
		const { collapse } = this.state;
		const { apiState } = this.props;
		let symbol;
        if (collapse) {
            symbol = '点击展开';
        }else {
        	symbol = '点击收起';
        }
        return(
        <li key={apiState.id}>
	        {apiState.name} {apiState.method} {apiState.uri}
	        <span className='api-detail-collapse' onClick={this.expandOrCollapse}>{symbol}</span>
	        <div className={collapse ? 'api-detail-notshow':'api-detail-show'}>
		        {apiState.description} {apiState.author} {apiState.isJson} {apiState.header} {apiState.param}
	        </div>
        </li>
        );
    }

    private expandOrCollapse = () => {
	    this.setState({
		    collapse : !this.state.collapse
	    });
    }

}

const mapStateToProps = (state: State): ApiListItemStateProps => {

	return {

	};

};

const mapDispatchToProps = (dispatch: Dispatch<any>): ApiListItemDispatchProps => {
    return {
    };
};


export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ApiListItem);