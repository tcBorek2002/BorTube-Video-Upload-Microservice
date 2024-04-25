import dotenv from 'dotenv';
import Connection, { ConnectionOptions } from 'rabbitmq-client';
import { VideoFileRouterRabbit } from './routes/VideoFileRouterRabbit';
import { AzureService } from './services/implementations/AzureService';
import { VideoFileService } from './services/implementations/VideoFileService';
import { PrismaVideoFileRepository } from './repositories/PrismaVideoFileRepository';

//For env File 
dotenv.config();

// RabbitMQ connection
const userName = "NodeUser";
const password = process.env.RABBITMQ_PASSWORD;
const options: ConnectionOptions = { username: userName, password: password, connectionName: 'Video Uploading Microservice', hostname: "217.105.22.226" };
const rabbit = new Connection(options);

rabbit.on('error', (err) => {
  console.log('RabbitMQ connection error', err)
})
rabbit.on('connection', () => {
  console.log('Connection successfully (re)established')
})
const uploadRouterRabbit = new VideoFileRouterRabbit(rabbit, new AzureService(), new VideoFileService(new PrismaVideoFileRepository()));
uploadRouterRabbit.start();
