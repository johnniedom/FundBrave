import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Subscribe to fundraiser updates
  @SubscribeMessage('subscribeFundraiser')
  handleSubscribe(client: Socket, fundraiserId: string) {
    client.join(`fundraiser:${fundraiserId}`);
  }

  // Emit donation event
  emitDonation(data: any) {
    this.server.to(`fundraiser:${data.fundraiserId}`).emit('donation', data);
  }

  // Emit notification
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}