import { VideoFile } from "@prisma/client";

export interface IVideoFileService {
    getVideoFileById(id: string): Promise<VideoFile | null>;
    deleteVideoFileById(id: string): Promise<VideoFile>;
    createVideoFile(duration: number, videoId: string): Promise<VideoFile>;
    updateVideoFile(id: string, duration?: number, videoUr?: string): Promise<VideoFile>;
}