import { VideoFile } from "@prisma/client";
import prisma from "../client";
import { IVideoFileRepository } from "./implementations/IVideoFileRepository";

export class PrismaVideoFileRepository implements IVideoFileRepository {
    async updateVideoFile(id: string, duration?: number | undefined, videoUrl?: string | undefined): Promise<VideoFile> {
        return await prisma.videoFile.update({ where: { id }, data: { duration, videoUrl } });
    }
    async findVideoFileByID(id: string): Promise<VideoFile | null> {
        return await prisma.videoFile.findUnique({ where: { id } });
    }
    async deleteVideoFileByID(id: string): Promise<VideoFile> {
        return await prisma.videoFile.delete({ where: { id } });
    }
    async createVideoFile(videoId: string, duration: number): Promise<VideoFile> {
        return await prisma.videoFile.create({
            data: {
                duration,
                video: {
                    connect: {
                        id: videoId,
                    }
                }
            }
        });
    }
}