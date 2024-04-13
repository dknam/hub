import { Str } from '@ecdh/util';
import { SERVER_M } from '../data_model';
import { DeployInfoHandlerBase } from './deployInfoHandlerBase';
import { DeployInfoHandlerV5 } from './deployInfoHandlerV5';
import { DeployInfoHandlerV3 } from './deployInfoHandlerV3';
import { DeployInfoModel } from './types';
import { nanoid } from 'nanoid';

export class DeployInfoService {
    private _handler: DeployInfoHandlerBase;

    constructor(
        private server: SERVER_M,
        private logkey?: string
    ) {
        if (Str.isEquals(server.OS, 'linux')) {
            this._handler = new DeployInfoHandlerV5();
        } else {
            this._handler = new DeployInfoHandlerV3();
        }
    }

    public async modify(modifier: (model: DeployInfoModel) => DeployInfoModel) {
        const content = await this._handler.read(this.server);
        let model = this._handler.parse(content);

        model = modifier(model);

        const logkey = this.logkey ?? nanoid(32);
        this._handler.save(this.server, model, logkey);
    }
}
