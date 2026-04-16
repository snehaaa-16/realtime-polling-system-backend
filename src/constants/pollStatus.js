const POLL_STATUS = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  DELETED: 'deleted',
});

const SOCKET_EVENTS = Object.freeze({
  JOIN_POLL: 'join_poll',
  LEAVE_POLL: 'leave_poll',
  VOTE: 'vote',
  POLL_UPDATE: 'poll_update',
  ERROR: 'error',
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
});

module.exports = { POLL_STATUS, SOCKET_EVENTS };
