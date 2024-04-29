import { BlobDeleteOptions, BlobSASPermissions, BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters } from "@azure/storage-blob";
import { ICloudService } from "../ICloudService";
import { InternalServerError } from "../../errors/InternalServerError";

export class AzureService implements ICloudService {
    private azureStorageConnectionString = process.env.AZURESTORAGECONNECTIONSTRING;
    private azureStorageKey = process.env.AZURESTORAGEKEY;
    private containerName = 'bortube-container';

    constructor() { }

    async deleteVideoCloud(videoUrl: string): Promise<void> {
        const options: BlobDeleteOptions = {
            deleteSnapshots: 'include' // or 'only'
        }

        if (this.azureStorageConnectionString == undefined) {
            throw new InternalServerError(500, "Azure Storage Connection String is not defined");
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(this.azureStorageConnectionString);
        const containerClient = blobServiceClient.getContainerClient(this.containerName);
        const blobName = this.extractFileNameFromURL(videoUrl);
        if (!blobName) {
            throw new InternalServerError(500, "Parsing video URL failed");
        }
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.deleteIfExists(options);
    }

    async checkUploadState(videoId: string): Promise<boolean> {
        if (this.azureStorageConnectionString == undefined) {
            throw new Error("Azure Storage Connection String is not defined");
        }
        if (this.azureStorageKey == undefined) {
            throw new Error("Azure Storage Key is not defined");
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(this.azureStorageConnectionString);
        const client = blobServiceClient.getContainerClient(this.containerName);

        let i = 1;
        for await (const blob of client.findBlobsByTags(`videoId='${videoId}'`)) {
            console.log(`Blob ${i++}: ${blob.name}`);
            return true;
        }

        return false;
    }

    getUploadUrl(blobName: string): string {
        const azureStorageAccount = "storagebortube";

        if (this.azureStorageConnectionString == undefined) {
            throw new Error("Azure Storage Connection String is not defined");
        }
        if (this.azureStorageKey == undefined) {
            throw new Error("Azure Storage Key is not defined");
        }
        const blobServiceClient = BlobServiceClient.fromConnectionString(this.azureStorageConnectionString);

        const sharedKeyCredential = new StorageSharedKeyCredential(azureStorageAccount, this.azureStorageKey);
        const client = blobServiceClient.getContainerClient(this.containerName)
        const blobClient = client.getBlobClient(blobName);
        const containerName = this.containerName;

        const blobSAS = generateBlobSASQueryParameters({
            containerName,
            blobName,
            permissions: BlobSASPermissions.parse("wt"),
            startsOn: new Date(Date.now() - 2000), // 2 seconds before now
            expiresOn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
            sharedKeyCredential
        ).toString();

        const sasUrl = blobClient.url + "?" + blobSAS;
        console.log(sasUrl);

        return sasUrl;
    }

    private extractFileNameFromURL(url: string): string | null {
        const lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            return url.substring(lastSlashIndex + 1);
        } else {
            return null;
        }
    }


}
