const express = require("express");
const router = require("express").Router();
const Image = require("../Schema/ImageSchema");
const Category = require("../Schema/CategorySchema");
const Order = require("../Schema/CardSchema")
const User = require("../Schema/UserSchema");
const mongoose = require("mongoose")
const QRcode = require("qrcode")
const Omise = require('omise');


const omiseClient = new Omise({
    publicKey: 'pkey_test_5z2b0ffpks8fpagqa9i',
    secretKey: 'skey_test_5z2b0fgkga7rjodmdi9'
});

const createPromptPayQRCode = async (req, res) => {
    try {
        const charge = await omiseClient.charges.create({
            amount: req.body.amount,
            currency: 'THB',
            source: {
                type: 'promptpay',
                phone_number: req.body.promptPayNumber
            }
        });

        const qrCodeUrl = charge.source.scannable_code.image.download_uri;
        
        console.log('PromptPay QR Code URL:', qrCodeUrl);
        return res.status(200).json({ qrCodeUrl });
    } catch (error) {
        console.error('Error creating PromptPay QR Code:', error);
        res.status(500).json({ error: 'Failed to create PromptPay QR Code' });
    }
};

  
  const createRecipient = async (req, res) => {
    try {
      const recipient = await omiseClient.recipients.create({
        name: req.body.name,
        email: req.body.email,
        type: req.body.type, // ประเภทของ recipient (individual or corporation)
        bank_account: {
          brand: req.body.brand, // ชื่อธนาคาร
          number: req.body.accountNumber, // เลขบัญชี
          name: req.body.accountName // ชื่อบัญชี
        }
      });
  
      console.log('Created recipient:', recipient);
      res.status(200).json(recipient);
    } catch (error) {
      console.error('Error creating recipient:', error);
      res.status(500).json({ error: 'Failed to create recipient' });
    }
  };
  
  const createProduct = async (req, res) => {
    try {
      const product = await omiseClient.products.create({
        name: req.body.name,
        amount: req.body.amount,
      });
  
      console.log('Created product:', product);
      res.status(200).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  };
  const charge = async (req, res) => {
    try {
        const charge = await omiseClient.charges.create({
            amount: req.body.amount,
            currency: 'THB',
            recipient: req.body.recipientId,
            card: req.body.cardToken
        });

        // เมื่อชำระเงินเสร็จสมบูรณ์ ให้ทำการโอนเงินไปยังผู้รับ
        const transfer = await omiseClient.transfers.create({
            amount: req.body.amount * 0.9, // จำนวนเงินที่ต้องการโอน
            currency: 'THB', // สกุลเงิน
            recipient: req.body.recipientId // รหัสผู้รับเงิน
        });

        console.log('Charge:', charge);
        console.log('Transfer:', transfer);

        // ส่งข้อมูลการโอนเงินกลับไปยังลูกค้า
        res.status(200).json({ charge, transfer });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
};

module.exports = {
    createPromptPayQRCode,createRecipient,createProduct,charge
  };