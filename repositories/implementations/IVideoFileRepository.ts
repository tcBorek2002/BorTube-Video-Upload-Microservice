import { VideoFile } from "@prisma/client";

export interface IVideoFileRepository {
    findVideoFileByID(id: string): Promise<VideoFile | null>;
    deleteVideoFileByID(id: string): Promise<VideoFile>;
    createVideoFile(videoId: string, duration: number): Promise<VideoFile>;
    updateVideoFile(id: string, duration?: number, videoUrl?: string): Promise<VideoFile>;
}