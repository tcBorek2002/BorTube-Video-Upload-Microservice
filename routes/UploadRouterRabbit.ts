import { Connection, Envelope } from 'rabbitmq-client';
import { IVideoService } from '../services/IVideoService';
import { Video } from '@prisma/client';
import { ResponseDto } from '../dtos/ResponseDto';
import { IUploadService } from '../services/IUploadService';
import { ErrorDto } from '../dtos/ErrorDto';


async function rabbitReply(reply: (body: any, envelope?: Envelope | undefined) => Promise<void>, response: ResponseDto<any>): Promise<void> {
    await reply(response);
}

export class UploadRouterRabbit {
    private rabbit: Connection;
    private uploadService: IUploadService;

    constructor(rabbit: Connection, uploadService: IUploadService) {
        this.rabbit = rabbit;
        this.uploadService = uploadService;
    }

    public start(): void {
        const getUploadUrl = this.rabbit.createConsumer(
            {
                queue: 'get-upload-url',
            },
            async (req, reply) => {
                console.log('Get upload url request:', req.body);
                if (req.body == null) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'blobName is required.')));
                }
                const { blobName } = req.body;
                if (!blobName) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'blobName is required.')));
                }
                try {
                    const url = this.uploadService.getUploadUrl(blobName);
                    rabbitReply(reply, new ResponseDto<{ url: string }>(true, { url }));
                }
                catch (error) {
                    console.error(error);
                    rabbitReply(reply, new ResponseDto(false, new ErrorDto(500, 'InternalServerError', 'An error occurred while generating the upload URL.' + error)));
                }

            }
        );

        const checkUploadState = this.rabbit.createConsumer(
            {
                queue: 'check-upload-state',
            },
            async (req, reply) => {
                console.log('Get all visible videos request:', req.body);
                rabbitReply(reply, new ResponseDto<Video[]>(false, new ErrorDto(501, 'NotImplementedError', 'Not implemented')));
            }
        );

        process.on('SIGINT', async () => {
            await Promise.all([
                getUploadUrl.close(),
                checkUploadState.close(),
            ]);
            await this.rabbit.close();
        });
    }
}