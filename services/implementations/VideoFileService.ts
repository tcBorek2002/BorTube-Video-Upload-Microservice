import { IVideoFileService } from "../IVideoFileService";
import { IVideoFileRepository } from "../../repositories/implementations/IVideoFileRepository";
import { VideoFile } from "@prisma/client";

export class VideoFileService implements IVideoFileService {
    constructor(private videoFileRepository: IVideoFileRepository,) { }

    async updateVideoFile(id: number, duration?: number | undefined, videoUr?: string | undefined): Promise<VideoFile> {
        return await this.videoFileRepository.updateVideoFile(id, duration, videoUr);
    }
    async getVideoFileById(id: number): Promise<VideoFile | null> {
        return await this.videoFileRepository.findVideoFileByID(id);
    }
    async deleteVideoFileById(id: number): Promise<VideoFile> {
        return await this.videoFileRepository.deleteVideoFileByID(id);
    }
    async createVideoFile(duration: number, videoId: number): Promise<VideoFile> {
        return await this.videoFileRepository.createVideoFile(videoId, duration);
    }


}
