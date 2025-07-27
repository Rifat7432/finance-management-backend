import colors from 'colors';
import { DefaultEventsMap, Server } from 'socket.io';
import { logger } from '../shared/logger';

export let socketIo: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
const socket = (io: Server) => {
     socketIo = io;
     io.on('connection', (socket) => {
          logger.info(colors.blue('A user connected'));

          //disconnect
          socket.on('disconnect', () => {
               logger.info(colors.red('A user disconnect'));
          });
     });
};

export const socketHelper = { socket };
