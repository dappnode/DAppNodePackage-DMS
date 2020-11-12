import http from "http";
import { StoredPackageDb } from "./db";

export class HttpApi {
  db: StoredPackageDb;
  private server: http.Server;

  constructor({ db, port }: { db: StoredPackageDb; port: number }) {
    this.db = db;
    this.server = http.createServer(this.onRequest.bind(this)).listen(port);
  }

  stop() {
    this.server.close();
  }

  onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
      if (req.url && req.url.includes("clear-db")) {
        this.db.clear();
        res.writeHead(200);
        res.end("Cleared DB");
      } else {
        res.writeHead(200);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(this.db.getAll(), null, 2));
      }
    } catch (e) {
      res.writeHead(500);
      res.end(e.stack);
    }
  }
}
