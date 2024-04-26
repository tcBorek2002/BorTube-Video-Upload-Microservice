import { VideoFile } from "@prisma/client";
import prisma from "../client";
import { IVideoFileRepository } from "./implementations/IVideoFileRepository";

export class PrismaVideoFileRepository implements IVideoFileRepository {
    async updateVideoFile(id: number, duration?: number | undefined, videoUrl?: string | undefined): Promise<VideoFile> {
        return await prisma.videoFile.update({ where: { id }, data: { duration, videoUrl } });
    }
    async findVideoFileByID(id: number): Promise<VideoFile | null> {
        return await prisma.videoFile.findUnique({ where: { id } });
    }
    async deleteVideoFileByID(id: number): Promise<VideoFile> {
        return await prisma.videoFile.delete({ where: { id } });
    }
    async createVideoFile(videoId: number, duration: number): Promise<VideoFile> {
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