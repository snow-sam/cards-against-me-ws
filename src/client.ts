import { io } from "socket.io-client";
import readline from "readline";

// Conecta ao servidor Socket.IO
const socket = io("http://localhost:4000", {
  query: {
    name: process.argv[2] || ""
  }
});

// Configuração para entrada e saída no terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Você> ",
});

socket.on("connect", () => console.log("Testando"))

// Evento para receber mensagens do servidor
socket.on("data", (type, data) => {
  console.log(`\nServidor: ${type} ${data}`);
  rl.prompt(); // Reexibe o prompt
});

// Lê mensagens do usuário e envia para o servidor
rl.prompt();
rl.on("line", (line) => {
  socket.emit("message", line.trim()); // Envia a mensagem ao servidor
  rl.prompt(); // Reexibe o prompt
}).on("close", () => {
  console.log("Conexão encerrada");
  process.exit(0);
});
