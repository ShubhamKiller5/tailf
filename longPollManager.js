class LongPollManager {
     constructor(tailF) {
          this.clients = new Set();
          this.tailF = tailF;
     }

     async add(res, offset) {
          const client = {
               res,
               offset,
               timeout: setTimeout(async () => {
                    await this.send(res, 200, {
                         data: '',
                         offset: offset,
                         reset: false,
                         timeout: true,
                    });
               }, 25000),
          };

          this.clients.add(client);
          return client;
     }

     async send(res, code, data) {
          await res.status(code).send(data);
     }

     async notify() {
          for (const client of [...this.clients]) {
               const data = await this.tailF(client.offset);
               if (data?.data?.length) {
                    clearTimeout(client.timeout);
                    await this.send(client.res, 200, data);
                    this.clients.delete(client);
               }
          }
     }
}
module.exports = LongPollManager;
