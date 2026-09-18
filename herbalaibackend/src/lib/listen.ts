import type { Server } from 'node:http';

export function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.removeListener('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    try {
      server.listen(port);
    } catch (error) {
      server.removeListener('error', onError);
      server.removeListener('listening', onListening);
      reject(error);
    }
  });
}
