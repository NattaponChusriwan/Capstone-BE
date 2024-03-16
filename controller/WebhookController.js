const express = require("express");
const router = require("express").Router();
const webhook = (req, res) => {
    const eventData = req.body;
  
    // Verify event authenticity - Omise usually includes a signature that you can validate
    // Handle different types of events, e.g., transfer.created, transfer.failed, etc.
  
    if (eventData.object === 'transfer' && eventData.status === 'successful') {
      // This event indicates that a transfer was successfully created
      // Perform the action to actually send the transfer amount to the recipient
  
      // Example: Trigger an automatic action to send the transfer amount
      sendTransfer(eventData.transferId)
        .then(() => {
          // Transfer action completed successfully
          res.status(200).send('Transfer action completed');
        })
        .catch((error) => {
          console.error('Error sending transfer:', error);
          res.status(500).send('Error sending transfer');
        });
    } else {
      // Handle other types of events or ignore irrelevant events
      res.status(200).send('Event ignored');
    }
  };
  module.exports = {
    webhook,
  };
  