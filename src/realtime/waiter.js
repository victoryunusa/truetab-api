// src/realtime/waiter.js
let io;
function init(socketIo) {
  io = socketIo;
}
function room(order) {
  return `waiter:${order.brandId}:${order.branchId}`;
}
function emitOrderNew(o) {
  io?.to(room(o)).emit("order:new", o);
}
function emitOrderUpdated(o) {
  io?.to(room(o)).emit("order:updated", o);
}
module.exports = { init, emitOrderNew, emitOrderUpdated };
