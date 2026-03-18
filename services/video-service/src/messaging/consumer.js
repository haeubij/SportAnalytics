const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'video-service-consumer',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'video-service-group' });

/**
 * Handle a user.deleted event.
 * Deletes all videos (GridFS files + chunks) uploaded by that user.
 */
async function handleUserDeleted(payload) {
  const { userId, username } = payload;
  logger.info(`Processing user.deleted event: userId=${userId} username=${username}`);

  const db = mongoose.connection.db;
  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'videos' });

  const files = await bucket.find({ 'metadata.uploadedBy': userId }).toArray();
  logger.info(`Found ${files.length} video(s) for userId=${userId} – deleting...`);

  for (const file of files) {
    await bucket.delete(file._id);
    logger.info(`Deleted video fileId=${file._id} for userId=${userId}`);
  }
}

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
          await handleUserDeleted(payload);
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
