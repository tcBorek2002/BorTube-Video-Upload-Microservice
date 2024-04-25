import prisma from "../client";
import { IVideoFileRepository } from "./implementations/IVideoFileRepository";

export class PrismaVideoFileRepository implements IVideoFileRepository {
    async findVideoFileByID(id: number): Promise<{ id: number; duration: number; videoUrl: string; } | null> {
        return await prisma.videoFile.findUnique({ where: { id } });
    }
    async deleteVideoFileByID(id: number): Promise<{ id: number; duration: number; videoUrl: string; }> {
        return await prisma.videoFile.delete({ where: { id } });
    }
    async createVideoFile(videoId: number, duration: number, videoUrl: string): Promise<{ id: number; duration: number; videoUrl: string; }> {
        return await prisma.videoFile.create({
            data: {
                duration,
                videoUrl,
                video: {
                    connect: {
                        id: videoId,
                    }
                }
            }
        });
    }
}