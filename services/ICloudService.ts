
export interface ICloudService {
    getUploadUrl(blobName: string): string;
    checkUploadState(videoId: string): Promise<boolean>;
    deleteVideoCloud(videoUrl: string): Promise<void>;
}