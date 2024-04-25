import { IVideoFileService } from "../IVideoFileService";
import { IVideoFileRepository } from "../../repositories/implementations/IVideoFileRepository";

export class VideoFileService implements IVideoFileService {
    constructor(private videoFileRepository: IVideoFileRepository,) { }
    async getVideoFileById(id: number): Promise<{ id: number; duration: number; videoUrl: string; } | null> {
        return await this.videoFileRepository.findVideoFileByID(id);
    }
    async deleteVideoFileById(id: number): Promise<{ id: number; duration: number; videoUrl: string; }> {
        return await this.videoFileRepository.deleteVideoFileByID(id);
    }
    async createVideoFile(duration: number, videoUrl: string, videoId: number): Promise<{ id: number; duration: number; videoUrl: string; }> {
        return await this.videoFileRepository.createVideoFile(videoId, duration, videoUrl);
    }


}
