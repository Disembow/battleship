import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const httpServer = http.createServer(function (req, res) {
  const __dirname = path.resolve(path.dirname(''));
  const file_path = path.join(
    __dirname,
    req.url === '/' ? '/front/index.html' : '/front' + req.url,
  );

  fs.readFile(file_path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }

    res.writeHead(200);
    res.end(data);
  });
});

export const http_server = (port: number) =>
  httpServer.listen(port, () => {
    console.log(`Start static http server on the ${port} port, http://localhost:${port}`);
  });
