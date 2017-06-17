'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  User = mongoose.model('User'),
  Message = mongoose.model('Message'),
  async = require('async');

/**
 * create a Message
 * @param req
 * @param res
 */
exports.create = function (req, res) {
  var msg = new Message(req.body);
  msg.from_user = req.user._id;
  msg.from_status = 1;
  msg.to_status = 0;

  if (!msg.to_user || !mongoose.Types.ObjectId.isValid(msg.to_user)) {
    return res.status(400).send({
      message: 'Receiver user id is invalid'
    });
  }

  msg.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(msg);
    }
  });
};

/**
 * list Messages
 * @param req
 * @param res
 */
exports.list = function (req, res) {
  Message.find({
    $or: [
      {from_user: req.user._id},
      {to_user: req.user._id}
    ]
  })
    .sort('-updatedat, -createdat')
    .populate('from_user')
    .populate('to_user')
    .exec(function (err, messages) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.json(messages);
    });
};

/**
 * delete Message
 * @param req
 * @param res
 */
exports.delete = function (req, res) {
  if (req.params.messageId) {
    var message = req.message;
    message.remove(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(message);
      }
    });

  } else {
    if (req.query.ids) {
      Message.remove({
        _id: {$in: req.query.ids}
      }, function (err) {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          return res.status(200).send({
            message: 'delete successfully'
          });
        }
      });
    }
  }
};

/**
 * createReply
 * @param req
 * @param res
 */
exports.createReply = function (req, res) {

};

/**
 * deleteReply
 * @param req
 * @param res
 */
exports.deleteReply = function (req, res) {

};

/**
 * Invitation middleware
 */
exports.messageByID = function (req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Message is invalid'
    });
  }

  Message.findById(id)
    .populate('from_user')
    .populate('to_user')
    .exec(function (err, message) {
      if (err) {
        return next(err);
      } else if (!message) {
        return res.status(404).send({
          message: 'No message with that identifier has been found'
        });
      }
      req.message = message;
      next();
    });
};
