const { Kafka } = require('kafkajs');
const User = require('../models/User');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'user-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'user-service-group' });

/**
 * Handle a user.registered event.
 * Uses upsert to ensure idempotency: re-processing the same event
 * will not create duplicate users.
 */
async function handleUserRegistered(payload) {
  const { userId, username, email, role = 'user' } = payload;

  logger.info(`Processing user.registered event: userId=${userId} username=${username}`);

  // Idempotent upsert: if the user already exists, update; otherwise insert.
  await User.findOneAndUpdate(
    { _id: userId },
    {
      $setOnInsert: { createdAt: new Date() },
      $set: { username, email, role, isActive: true }
    },
    { upsert: true, new: true, runValidators: false }
  );

  logger.info(`User upserted successfully: userId=${userId}`);
}

async function startConsumer() {
  try {
    await consumer.connect();
    logger.info('Kafka consumer connected');

    await consumer.subscribe({ topic: 'user.registered', fromBeginning: false });
    logger.info('Subscribed to topic: user.registered');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          logger.info(`Received message from ${topic}[${partition}]: ${JSON.stringify(payload)}`);
          await handleUserRegistered(payload);
        } catch (err) {
          logger.error(`Error processing message from ${topic}: ${err.message}`);
        }
      }
    });
  } catch (err) {
    logger.error(`Kafka consumer failed to start: ${err.message}`);
    // Don't crash the server – Kafka may not be available in dev
  }
}

async function stopConsumer() {
  try {
    await consumer.disconnect();
    logger.info('Kafka consumer disconnected');
  } catch (err) {
    logger.error(`Error disconnecting Kafka consumer: ${err.message}`);
  }
}

module.exports = { startConsumer, stopConsumer };
