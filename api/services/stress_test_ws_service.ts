import * as WS from 'ws';
import { ScheduleService } from './schedule_service';
import { ScheduleRunner } from '../run_engine/schedule_runner';
import { WebSocketHandler } from './base/web_socket_handler';
import { Log } from '../utils/log';
import { StressRequest, StressResponse } from '../interfaces/dto_stress_setting';
import { ChildProcessManager } from '../run_engine/process/child_process_manager';
import { StringUtil } from '../utils/string_util';
import { StressMessageType } from '../common/stress_type';
import { RecordService } from './record_service';
import { StressService } from './stress_service';
import { ScriptTransform } from '../utils/script_transform';
import { StressProcessHandler } from '../run_engine/process/stress_process_handler';

export class StressTestWSService extends WebSocketHandler {

    private id: string;

    constructor() {
        super();
        this.id = StringUtil.generateShortId();
    }

    private get processHandler() {
        return ChildProcessManager.default.getHandler('stress') as StressProcessHandler;
    }

    init() {
        this.processHandler.initStressUser(this.id, data => this.handleMsg(data));
    }

    onReceive(data: string) {
        Log.info(`Stress Test - receive data: ${data}`);
        let info;
        try {
            info = JSON.parse(data);
        } catch (e) {
            Log.error(e);
            return;
        }

        this.pass(info);
    }

    onClose() {
        Log.info('Stress Test - client close');
        this.processHandler.closeStressUser(this.id);
        this.close();
    }

    async pass(info: StressRequest): Promise<any> {
        if (!info) {
            this.close('Stress Test - invalid info');
            return;
        }

        if (info.type === StressMessageType.task) {
            info.id = this.id;
            const data = await StressService.getStressInfo(info.stressId);
            if (!data.success) {
                this.send(JSON.stringify({ type: StressMessageType.error, data: data.message }));
                return;
            }
            info.testCase = data.result.testCase;
            // info.fileData = await ScriptTransform.zipAll();
            info.stressName = data.result.name;
            this.processHandler.sendStressTask(info);
        } else if (info.type === StressMessageType.stop) {
            this.processHandler.stopStressTask(this.id);
        }
    }

    handleMsg = (data: StressResponse) => {
        if (this.socket.readyState === this.socket.OPEN) {
            this.send(JSON.stringify(data));
        }
    }
}