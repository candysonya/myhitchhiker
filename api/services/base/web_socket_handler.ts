import * as WS from 'ws';
import { Log } from '../../utils/log';

export abstract class WebSocketHandler {

    protected socket: WS;

    handle = (socket: WS) => {
        this.socket = socket;
        this.init();
        socket.on('message', data => this.onReceive(data as string));
        socket.on('close', () => this.onClose());
    }

    init() {
        Log.info('ws init');
    }

    abstract onReceive(data: string);

    abstract onClose();

    send = (data: string) => {
        this.socket.send(data);
    }

    close = (data?: string) => {
        this.socket.close(1000, data);
    }
}