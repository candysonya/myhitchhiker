import { GET, POST, PUT, DELETE, BodyParam, PathParam, BaseController } from 'webapi-router';
import { ResObject } from '../common/res_object';
import * as Koa from 'koa';
import { ApiService } from '../services/api_service';
import { DtoApi } from "../interfaces/dto_api";

export default class ApiController extends BaseController {

    @GET('/apis')
    async getApis(ctx: Koa.Context): Promise<ResObject> {
    	const apis = await ApiService.getChildren();
        return { success: true, message: '', result: apis };
    }

	@POST('/api/save')
	async saveApi(ctx: Koa.Context, @BodyParam api: DtoApi): Promise<ResObject> {
		return await ApiService.save(api);
	}

	@DELETE('/api/:id')
	async removeApi(@PathParam('id') id: string): Promise<ResObject> {
		return await ApiService.delete(id);
	}

}