import { User } from '../models/user';
import { ConnectionManager } from './connection_manager';
import { Message } from '../common/message';
import { ResObject } from '../common/res_object';
import { ValidateUtil } from '../utils/validate_util';
import { Setting } from '../utils/setting';
import { MailService } from './mail_service';
import { StringUtil } from '../utils/string_util';
import { ProjectService } from './project_service';
import * as _ from 'lodash';
import { UserProjectService } from './user_project_service';
import { SampleService } from './sample_service';
import {Project} from "../models/project";

export class UserService {

    static create(name: string, email: string, password: string) {
        const user = new User();
        user.name = name;
        user.email = email;
        user.password = StringUtil.md5Password(password);
        user.id = StringUtil.generateUID();
        return user;
    }

    static async save(user: User) {
        const connection = await ConnectionManager.getInstance();
        await connection.getRepository(User).save(user);
    }

    static async checkUser(email: string, pwd: string, isMd5Pwd: boolean): Promise<ResObject> {
        const user = await UserService.getUserByEmail(email, true);
        if (user && (isMd5Pwd || user.password === StringUtil.md5Password(pwd))) {
            if (user.isActive) {
                const userInfo = await UserProjectService.getUserInfo(user);
                return { success: true, message: '', result: userInfo };
            } else {
                return { success: false, message: Message.get('accountNotActive') };
            }
        }
        return { success: false, message: Message.get('userCheckFailed') };
    }

    static async checkUserById(userId: string): Promise<ResObject> {
        const user = await UserService.getUserById(userId, false);
        return { success: !!user, message: !!user ? '' : Message.get('userNotExist'), result: user };
    }

    static async createUser(name: string, email: string, pwd: string, isAutoGenerate: boolean = false, isTemp: boolean = false): Promise<ResObject> {
        let checkRst = ValidateUtil.checkEmail(email);
        if (checkRst.success) { checkRst = ValidateUtil.checkPassword(pwd); }
        if (checkRst.success) { checkRst = ValidateUtil.checkUserName(name); }
        if (!checkRst.success) {
            return checkRst;
        }

        const isEmailExist = await UserService.IsUserEmailExist(email);
        if (isEmailExist) {
            return { success: false, message: Message.get('userEmailRepeat') };
        }

        const user = UserService.create(name, email, pwd);
        user.isActive = isAutoGenerate || !Setting.instance.needRegisterMailConfirm;
        user.isTemp = isTemp;
        await UserService.save(user);

        if (!user.isActive) {
            MailService.registerMail(user);
        }

        const project = await ProjectService.createOwnProject(user);

        await SampleService.createSampleForUser(user, project.id);

        return { success: true, message: Setting.instance.needRegisterMailConfirm ? Message.get('regSuccessNeedConfirm') : Message.get('regSuccess'), result: user };
    }

    static async createUserByEmail(email: string, isAutoGenerate: boolean = false): Promise<ResObject> {
        let checkRst = ValidateUtil.checkEmail(email);
        if (!checkRst.success) {
            return checkRst;
        }

        const name = email.substr(0, email.indexOf('@'));
        const password = Setting.instance.app.defaultPassword;
        return await UserService.createUser(name, email, password, isAutoGenerate);
    }

    static async IsUserEmailExist(email: string): Promise<boolean> {
        const user = await UserService.getUserByEmail(email);

        return user !== undefined;
    }

    static async getUserByEmail(email: string, needProject?: boolean): Promise<User> {
        const connection = await ConnectionManager.getInstance();

        let rep = connection.getRepository(User)
            .createQueryBuilder('user')
            .where(`user.email = :email`)
            .setParameter('email', email);

        if (needProject) { rep = rep.leftJoinAndSelect('user.projects', 'project'); };

        const user = await rep.getOne();

	    const system_projects = await connection.getRepository(Project).createQueryBuilder('project').where('project.ownerId=:uid', {uid:'0'}).getMany();
	    user.projects = [...user.projects, ...system_projects];

        if (user && needProject) {
            user.projects = await ProjectService.getProjects(user.projects.map(t => t.id), true, false, true, true);
        }

        return user;
    }

    static async getUserById(id: string, needProject?: boolean): Promise<User> {
        const connection = await ConnectionManager.getInstance();

        const user = await connection.getRepository(User)
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.projects', 'project')
            .where(`user.id = :id`)
            .setParameter('id', id)
            .getOne();

	    const system_projects = await connection.getRepository(Project).createQueryBuilder('project').where('project.ownerId=:uid', {uid:'0'}).getMany();
	    user.projects = [...user.projects, ...system_projects];
        if (user && needProject) {
            user.projects = await ProjectService.getProjects(user.projects.map(t => t.id), true, false, true, true);
        }
        return user;
    }

    static async getNameByIds(ids: string[]): Promise<_.Dictionary<User>> {
        if (!ids || ids.length === 0) {
            return {};
        }

        const connection = await ConnectionManager.getInstance();

        const users = await connection.getRepository(User)
            .createQueryBuilder('user')
            .where('1=1')
            .andWhereInIds(ids.map(id => ({ id })))
            .getMany();

        const userDict: _.Dictionary<User> = {};
        users.forEach(u => { u.password = ''; userDict[u.id] = u; });
        return userDict;
    }

    static async active(id: string) {
        const connection = await ConnectionManager.getInstance();
        await connection.getRepository(User)
            .createQueryBuilder('user')
            .update({ isActive: true })
            .where('id=:id')
            .setParameter('id', id)
            .execute();
    }

    static async changePwd(id: string, newPwd: string): Promise<ResObject> {
        const connection = await ConnectionManager.getInstance();
        await connection.getRepository(User)
            .createQueryBuilder('user')
            .update({ password: StringUtil.md5Password(newPwd) })
            .where('id=:id')
            .setParameter('id', id)
            .execute();
        return { success: true, message: Message.get('userChangePwdSuccess') };
    }

    static async deleteTempUser() {
        const connection = await ConnectionManager.getInstance();
        const users = await connection.getRepository(User)
            .createQueryBuilder('user')
            .where(`user.isTemp = true`)
            .leftJoinAndSelect('user.projects', 'project')
            .getMany();

        if (!users || users.length === 0) {
            return;
        }

        const ids = _.flatten(users.map(u => u.projects)).map(p => p.id);
        for (let i = 0; i < ids.length; i++) {
            await ProjectService.delete(ids[i], true, true);
        }
        await Promise.all(users.map(u => connection.manager.remove(u)));
    }
}