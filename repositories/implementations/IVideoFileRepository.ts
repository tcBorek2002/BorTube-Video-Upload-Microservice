import { VideoFile } from "@prisma/client";

export interface IVideoFileRepository {
    findVideoFileByID(id: number): Promise<VideoFile | null>;
    deleteVideoFileByID(id: number): Promise<VideoFile>;
    createVideoFile(videoId: number, duration: number): Promise<VideoFile>;
}