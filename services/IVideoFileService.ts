import { VideoFile } from "@prisma/client";

export interface IVideoFileService {
    getVideoFileById(id: number): Promise<VideoFile | null>;
    deleteVideoFileById(id: number): Promise<VideoFile>;
    createVideoFile(duration: number, videoUrl: string, videoId: number): Promise<VideoFile>;
}