const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'auth-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'auth-service-group' });

async function startConsumer() {
  try {
    await consumer.connect();
    logger.info('Kafka consumer connected');

    await consumer.subscribe({ topic: 'user.deleted', fromBeginning: false });
    logger.info('Subscribed to topic: user.deleted');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          logger.info(`Received message from ${topic}[${partition}]: ${JSON.stringify(payload)}`);
          // Auth service acknowledges user deletion events for audit purposes
          logger.info(`User deletion acknowledged: userId=${payload.userId}`);
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
