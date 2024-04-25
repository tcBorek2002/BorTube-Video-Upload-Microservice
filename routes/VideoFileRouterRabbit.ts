import { Connection, Envelope } from 'rabbitmq-client';
import { Prisma, Video, VideoFile } from '@prisma/client';
import { ResponseDto } from '../dtos/ResponseDto';
import { ICloudService } from '../services/ICloudService';
import { ErrorDto } from '../dtos/ErrorDto';
import { IVideoFileService } from '../services/IVideoFileService';


async function rabbitReply(reply: (body: any, envelope?: Envelope | undefined) => Promise<void>, response: ResponseDto<any>): Promise<void> {
    await reply(response);
}

export class VideoFileRouterRabbit {
    private rabbit: Connection;
    private cloudService: ICloudService;
    private videoFileService: IVideoFileService;

    constructor(rabbit: Connection, cloudService: ICloudService, videoFileService: IVideoFileService) {
        this.rabbit = rabbit;
        this.cloudService = cloudService;
        this.videoFileService = videoFileService;
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
                    const url = this.cloudService.getUploadUrl(blobName);
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
                console.log('Check-upload-state request:', req.body);

                if (req.body == null) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'videoId is required.')));
                }
                const { videoId } = req.body;
                if (!videoId) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'videoId is required.')));
                }

                let uploaded = await this.cloudService.checkUploadState(videoId);
                rabbitReply(reply, new ResponseDto<{ uploadState: boolean }>(true, { uploadState: uploaded }));
            }
        );

        const deleteVideoFile = this.rabbit.createConsumer(
            {
                queue: 'delete-video-file',
            },
            async (req, reply) => {
                console.log('Delete-vide-file request:', req.body);

                if (req.body == null) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'videoFileId is required.')));
                }
                const { videoFileId } = req.body;
                if (!videoFileId) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'videoFileId is required.')));
                }

                let deleted = await this.videoFileService.deleteVideoFileById(videoFileId).catch((error) => {
                    if (error instanceof Prisma.PrismaClientKnownRequestError) {
                        return rabbitReply(reply, new ResponseDto(false, new ErrorDto(404, 'VideoFileNotFound', 'The videoFile was already deleted..' + error)));
                    }
                    return rabbitReply(reply, new ResponseDto(false, new ErrorDto(500, 'InternalServerError', 'An error occurred while deleting the video file.' + error)));
                });

                if (deleted) {
                    rabbitReply(reply, new ResponseDto<{ deleteVideoFile: VideoFile }>(true, { deleteVideoFile: deleted }));
                } else {
                    rabbitReply(reply, new ResponseDto(false, new ErrorDto(500, 'InternalServerError', 'An error occurred while deleting the video file.')));
                }
            }
        );

        process.on('SIGINT', async () => {
            await Promise.all([
                getUploadUrl.close(),
                checkUploadState.close(),
                deleteVideoFile.close(),
            ]);
            await this.rabbit.close();
        });
    }

}