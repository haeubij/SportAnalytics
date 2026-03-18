const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'auth-service-publisher',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const producer = kafka.producer();
let isConnected = false;

async function connectProducer() {
  if (isConnected) return;
  try {
    await producer.connect();
    isConnected = true;
    logger.info('Kafka producer connected');
  } catch (err) {
    logger.error(`Kafka producer connection failed: ${err.message}`);
    throw err;
  }
}

/**
 * Publish a user.registered event to Kafka.
 * Consumed by the User Service to create/sync the user profile.
 * @param {string} userId
 * @param {string} username
 * @param {string} email
 * @param {string} role
 */
async function publishUserRegistered(userId, username, email, role) {
  await connectProducer();

  const message = {
    userId,
    username,
    email,
    role,
    timestamp: new Date().toISOString()
  };

  await producer.send({
    topic: 'user.registered',
    messages: [{ key: userId, value: JSON.stringify(message) }]
  });

  logger.info(`Published user.registered event for userId=${userId} username=${username}`);
}

async function disconnectProducer() {
  if (!isConnected) return;
  await producer.disconnect();
  isConnected = false;
  logger.info('Kafka producer disconnected');
}

module.exports = { publishUserRegistered, disconnectProducer };
