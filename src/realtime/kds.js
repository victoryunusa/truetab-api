// src/realtime/kds.js
let io; // set from app.js when you create socket.io

function init(socketIo) {
  io = socketIo;
}
function emitOrderNew(order) {
  io?.to(room(order)).emit("kds:order:new", order);
}
function emitOrderUpdated(order) {
  io?.to(room(order)).emit("kds:order:updated", order);
}
function emitOrderStarted(order) {
  io?.to(room(order)).emit("kds:order:started", order);
}
function emitOrderReady(order) {
  io?.to(room(order)).emit("kds:order:ready", order);
}
function emitOrderServed(order) {
  io?.to(room(order)).emit("kds:order:served", order);
}
function emitOrderPaid(order) {
  io?.to(room(order)).emit("kds:order:paid", order);
}
function room(order) {
  return `kds:${order.brandId}:${order.branchId}`;
}

module.exports = {
  init,
  emitOrderNew,
  emitOrderUpdated,
  emitOrderStarted,
  emitOrderReady,
  emitOrderServed,
  emitOrderPaid,
};
