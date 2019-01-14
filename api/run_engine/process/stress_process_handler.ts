import { BaseProcessHandler } from './base_process_handler';
import { ChildProcess } from 'child_process';
import { StressResponse, StressRequest } from '../../interfaces/dto_stress_setting';
import { StressMessageType } from '../../common/stress_type';
import { Log } from '../../utils/log';

export class StressProcessHandler extends BaseProcessHandler {

    private stressHandlers: _.Dictionary<(data: StressResponse) => void> = {};

    handleMessage(msg: any) {
        if (this.stressHandlers[msg.id]) {
            this.stressHandlers[msg.id](msg.data);
        }
    }

    afterProcessCreated() {
        this.process.send({ type: StressMessageType.start });
    }

    initStressUser(id: string, dataHandler: (data: StressResponse) => void) {
        this.stressHandlers[id] = dataHandler;
        this.process.send({ type: StressMessageType.init, id });
    }

    closeStressUser(id: string) {
        Reflect.deleteProperty(this.stressHandlers, id);
        this.process.send({ type: StressMessageType.close, id });
    }

    sendStressTask(request: StressRequest) {
        Log.info('send stress test task.');
        this.process.send(request);
    }

    stopStressTask(id: string) {
        Log.info('stop stress test task.');
        this.process.send({ type: StressMessageType.stop, id });
    }
}