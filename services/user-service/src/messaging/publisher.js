const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'user-service-publisher',
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
 * Publish a user.deleted event to Kafka.
 * Called after a user has been removed from the database.
 * @param {string} userId
 * @param {string} username
 */
async function publishUserDeleted(userId, username) {
  await connectProducer();

  const message = {
    userId,
    username,
    timestamp: new Date().toISOString()
  };

  await producer.send({
    topic: 'user.deleted',
    messages: [{ key: userId, value: JSON.stringify(message) }]
  });

  logger.info(`Published user.deleted event for userId=${userId} username=${username}`);
}

async function disconnectProducer() {
  if (!isConnected) return;
  await producer.disconnect();
  isConnected = false;
  logger.info('Kafka producer disconnected');
}

module.exports = { publishUserDeleted, disconnectProducer };
