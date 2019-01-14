import { POST, DELETE, PUT, PathParam, BodyParam, BaseController } from 'webapi-router';
import { ResObject } from '../common/res_object';
import * as Koa from 'koa';
import { EnvironmentService } from '../services/environment_service';
import { DtoEnvironment } from '../interfaces/dto_environment';

export default class EnvironmentController extends BaseController {

    @POST('/environment')
    async create(ctx: Koa.Context, @BodyParam env: DtoEnvironment): Promise<ResObject> {
        return await EnvironmentService.create(env);
    }

    @PUT('/environment')
    async update(ctx: Koa.Context, @BodyParam env: DtoEnvironment): Promise<ResObject> {
        return await EnvironmentService.update(env);
    }

    @DELETE('/environment/:id')
    async delete( @PathParam('id') id: string) {
        return await EnvironmentService.delete(id);
    }

}