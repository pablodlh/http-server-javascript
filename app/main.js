const net = require("net");
const fs = require("fs");
console.log("Logs from your program will appear here!");
const fileDir = process.argv[3]
console.log("Directory: ", fileDir)
const newLine = "\r\n";
function makeResponse(value, contentType = "text/plain") {
    let result = ""
    result += `HTTP/1.1 200 OK${newLine}`
    result += `Content-Type: ${contentType}${newLine}`
    result += `Content-Length: ${value.length}${newLine}`
    result += newLine
    result += `${value}${newLine}${newLine}`
    return result;
}
const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
        server.close();
    });
    socket.on("data", (data) => {
        const lines = data.toString().split("\r\n")
        const [firstLine, ...requestLines] = lines
        const headers = requestLines.slice(0, requestLines.length - 1)
        const body = requestLines[requestLines.length - 1]
        const [method, path, httpVersion] = firstLine.split(" ")
        if (method === "POST") {
            const filename = path.split("/files/")[1]
            const filePath = `${fileDir}/${filename}`
            try {
                fs.writeFileSync(filePath, body);
                socket.write(`HTTP/1.1 201 CREATED${newLine}${newLine}`);
                return socket.close()
            } catch (err) {
                console.error(err);
            }
        }
        if (path.startsWith("/echo/")) {
            const randomString = path.split("/echo/")[1]
            const result = makeResponse(randomString);
            socket.write(result)
        } else if (path.startsWith("/user-agent")) {
            const userAgent = headers.find(header => header.startsWith("User-Agent: ")).split("User-Agent: ")[1]
            const result = makeResponse(userAgent)
            socket.write(result)
        } else if (path.startsWith("/files/")) {
            const filename = path.split("/files/")[1]
            const filePath = `${fileDir}/${filename}`
            if (!fs.existsSync(filePath)) {
                socket.write(`HTTP/1.1 404 NOT_FOUND${newLine}${newLine}`);
                return socket.end()
            }
            const data = fs.readFileSync(filePath)
            const result = makeResponse(data, "application/octet-stream")
            socket.write(result)
        } else if (path === "/") {
            socket.write(`HTTP/1.1 200 OK${newLine}${newLine}`);
        } else {
            socket.write(`HTTP/1.1 404 NOT_FOUND${newLine}${newLine}`);
        }
    });
});
server.listen(4221, "localhost");