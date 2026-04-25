const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const FILE = path.join(__dirname + '/app.log');
// const LongPollManager = require('./longPollManager');
const SSEManager = require('./sseManager');

const tailLastNLine = async (n, chunk = 62 * 1024) => {
     const fd = await fs.promises.open(FILE, 'r');
     try {
          let size = (await fs.promises.stat(FILE)).size;
          let buffer = [];
          let n1 = 0,
               pos = size;
          while (size && n1 < n) {
               let len = Math.min(size, chunk);
               let alloc = Buffer.alloc(len);
               size -= len;

               let { bytesRead } = await fd.read(alloc, 0, len, size);
               alloc = alloc.subarray(0, bytesRead);

               buffer.push(alloc);

               for (let i = 0; i < alloc.length; i++) if (alloc[i] == 10) n1++;
          }
          const text = Buffer.concat(buffer.reverse()).toString('utf-8');

          return { data: text.split('\n').slice(-n).join('\n'), offset: pos };
     } catch (error) {
          throw error;
     } finally {
          await fd.close();
     }
};

const tailF = async (offset) => {
     let size = (await fs.promises.stat(FILE)).size;
     if (size == offset) return { data: '', offset: offset, reset: false };
     if (size < offset) return { data: '', offset: size, reset: true };

     const fd = await fs.promises.open(FILE, 'r');
     try {
          const len = size - offset;
          const buffer = Buffer.allocUnsafe(len);
          let { bytesRead } = await fd.read(buffer, 0, len, offset);
          const actualBytes = buffer.subarray(0, bytesRead);
          return {
               data: actualBytes.toString('utf-8'),
               offset: offset + bytesRead,
          };
     } finally {
          await fd.close();
     }
};
// const lp = new LongPollManager(tailF);
const sse = new SSEManager(tailF);
fs.watch(FILE, () => {
     sse.notify();
});

app.get('/tail', async (req, res) => {
     return res.status(200).json(await tailLastNLine(req.query.n));
});

app.get('/updates', async (req, res) => {
     const { offset } = req.query;
    //  let data = await tailF(Number(offset));
    //  if (data.data.length) return res.status(200).json(data);

     sse.add(res, Number(offset));
     //  res.on('close', () => {
     //       clearTimeout(client.timeout);
     //       this.clients.delete(client);
     //  });
     sse.notify();
});

app.listen(3000, () => {
     console.log('Server started at port', 3000);
});
