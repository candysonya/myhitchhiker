import { LoginSuccessType, LoginFailedType, RegisterSuccessType, RegisterFailedType, LoginPendingType, RegisterPendingType, RegisterResetType, FindPasswordSuccessType, FindPasswordPendingType, FindPasswordFailedType, ChangePasswordSuccessType, ChangePasswordFailedType, ChangePasswordPendingType, LoginResetType, LoginType, SyncUserDataSuccessType } from '../action/user';
import { UserInfoState, userInfoDefaultValue } from '../state/user';
import { RequestStatus } from '../common/request_status';
import { SessionInvalidType } from '../action/index';
import { GlobalVar } from '../utils/global_var';
import LocalesString from '../locales/string';

export function userState(state: UserInfoState = userInfoDefaultValue, action: any): UserInfoState {
    switch (action.type) {
        case LoginType: {
            return { ...state, lastLoginName: action.value.email };
        }
        case LoginSuccessType: {
            GlobalVar.instance.enableUploadProjectData = action.value.result.enableUpload;
            return { ...state, userInfo: action.value.result.user, loginState: { status: RequestStatus.success, message: action.value.message } };
        }
        case SyncUserDataSuccessType: {
            return { ...state, userInfo: action.value.result.user };
        }
        case LoginFailedType: {
            return { ...state, loginState: { status: RequestStatus.failed, message: action.value } };
        }
        case LoginPendingType: {
            return { ...state, loginState: { status: RequestStatus.pending } };
        }
        case LoginResetType: {
            return { ...state, loginState: { status: RequestStatus.failed, message: '' } };
        }
        case RegisterSuccessType: {
            return { ...state, registerState: { status: RequestStatus.success, message: action.value.message } };
        }
        case RegisterFailedType: {
            return { ...state, registerState: { status: RequestStatus.failed, message: action.value } };
        }
        case RegisterPendingType: {
            return { ...state, registerState: { status: RequestStatus.pending } };
        }
        case RegisterResetType: {
            return { ...state, registerState: { status: RequestStatus.none, message: '' } };
        }
        case FindPasswordSuccessType: {
            return { ...state, findPasswordState: { status: RequestStatus.success, message: LocalesString.get('FindPassword.SendANew') } };
        }
        case FindPasswordFailedType: {
            return { ...state, findPasswordState: { status: RequestStatus.failed, message: action.value } };
        }
        case FindPasswordPendingType: {
            return { ...state, findPasswordState: { status: RequestStatus.pending } };
        }
        case ChangePasswordSuccessType: {
            return { ...state, changePasswordState: { status: RequestStatus.success, message: LocalesString.get('FindPassword.ChangePwdSuccess') } };
        }
        case ChangePasswordFailedType: {
            return { ...state, changePasswordState: { status: RequestStatus.failed, message: action.value } };
        }
        case ChangePasswordPendingType: {
            return { ...state, changePasswordState: { status: RequestStatus.pending, message: '' } };
        }
        case SessionInvalidType: {
            return { ...state, loginState: { status: RequestStatus.failed, message: LocalesString.get('Login.SessionInvalid') } };
        }
        default:
            return state;
    }
}