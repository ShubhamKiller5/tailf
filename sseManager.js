class SSEManager {
     constructor(tailF) {
          this.clients = new Set();
          this.tailF = tailF;
     }

     add(res, offset) {
          res.set({
               'Content-Type': 'text/event-stream',
               'Cache-Control': 'no-cache',
               Connection: 'keep-alive',
          });
          res.flushHeaders();

          const client = { res, offset };
          this.clients.add(client);
          res.on('close', () => {
               this.clients.delete(client);
          });
     }

     send(client, event, data) {
          client.res.write(`event:${event}\n`);
          const lines = data.split('\n');
          for (const line of lines) {
               client.res.write(`data:${line}\n`);
          }
          client.res.write('\n');
     }

     async notify() {
          for (const client of [...this.clients]) {
               let data = await this.tailF(client.offset);
               if (data.reset) {
                    this.send(client, 'reset', 'file reset');
                    client.offset = data.offset;
               } else if(data.data.length) {
                    this.send(client, 'append', data.data);
                    client.offset = data.offset;
               }
          }
     }
}
module.exports = SSEManager;
