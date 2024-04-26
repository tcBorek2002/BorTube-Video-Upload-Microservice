import { VideoFile } from "@prisma/client";

export interface IVideoFileService {
    getVideoFileById(id: number): Promise<VideoFile | null>;
    deleteVideoFileById(id: number): Promise<VideoFile>;
    createVideoFile(duration: number, videoId: number): Promise<VideoFile>;
    updateVideoFile(id: number, duration?: number, videoUr?: string): Promise<VideoFile>;
}