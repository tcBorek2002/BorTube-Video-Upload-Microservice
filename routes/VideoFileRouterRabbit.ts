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
                    const videoUrl = "https://storagebortube.blob.core.windows.net/bortube-container/" + blobName;

                    rabbitReply(reply, new ResponseDto<{ url: string }>(true, { url }));
                }
                catch (error) {
                    console.error(error);
                    rabbitReply(reply, new ResponseDto(false, new ErrorDto(500, 'InternalServerError', 'An error occurred while generating the upload URL.' + error)));
                }

            }
        );

        const createVideoFile = this.rabbit.createConsumer(
            {
                queue: 'create-video-file',
            },
            async (req, reply) => {
                console.log('Create video-file request:', req.body);
                if (req.body == null) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'blobName is required.')));
                }
                const { blobName, duration, videoId } = req.body;
                if (!blobName || !duration || !Number.isInteger(duration)) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'blobName is required.')));
                }
                try {
                    const videoFile = await this.videoFileService.createVideoFile(duration, videoId);
                    rabbitReply(reply, new ResponseDto<VideoFile>(true, videoFile));
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
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'videoId, videoFileId and fileName are required.')));
                }
                const { videoId, videoFileId, fileName } = req.body;
                if (!videoId || !videoFileId || !fileName) {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(400, 'InvalidInputError', 'videoId, videoFileId and fileName are required.')));
                }

                let uploaded = await this.cloudService.checkUploadState(videoId);
                if (uploaded) {
                    const blobName = videoId + "_" + fileName;
                    const videoUrl = "https://storagebortube.blob.core.windows.net/bortube-container/" + blobName;
                    await this.videoFileService.updateVideoFile(videoFileId, undefined, videoUrl);
                    rabbitReply(reply, new ResponseDto<{ uploadState: boolean }>(true, { uploadState: uploaded }));
                }
                else {
                    return await rabbitReply(reply, new ResponseDto(false, new ErrorDto(404, 'VideoNotFound', 'The video was not uploaded.')));
                }
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
                    if (deleted.videoUrl) {
                        await this.cloudService.deleteVideoCloud(deleted.videoUrl);
                    }
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
                createVideoFile.close()
            ]);
            await this.rabbit.close();
        });
    }

}