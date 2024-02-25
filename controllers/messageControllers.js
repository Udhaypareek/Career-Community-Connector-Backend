const asyncHandler = require("express-async-handler");
const Message = require("../Models/messageModel");
const User = require("../Models/userModel");
const Chat = require("../Models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    // Find all messages belonging to the specified chatId
    const messages = await Message.find({ chat: req.params.chatId })
      // Populate the 'sender' field of each message with name, pic, and email
      .populate("sender", "name pic email")
      // Populate the 'chat' field of each message
      .populate("chat");
    
    // Send the populated messages to the client
    res.json(messages);
  } catch (error) {
    // If an error occurs during the process, handle and respond with an error status
    res.status(400);
    throw new Error(error.message);
  }
});


//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected

const sendMessage = asyncHandler(async (req, res) => {
  // Extract content and chatId from the request body
  const { content, chatId } = req.body;

  // Check if content or chatId is missing
  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400); // Send 400 Bad Request if content or chatId is missing
  }

  // Create a new message object
  var newMessage = {
    sender: req.user._id, // Set sender to the current user's ID
    content: content, // Set content to the provided content
    chat: chatId, // Set chat to the provided chatId
  };

  try {
    // Create the message in the database
    var message = await Message.create(newMessage);

    // Populate sender details for the message
    message = await message.populate("sender", "name pic");// Removed Exactpopulate();
    // Populate chat details for the message
    message = await message.populate("chat");// Removed Exactpopulate();
    // Populate user details for the chat
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    // Update the latestMessage field of the chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    // Send the created message as the response
    res.json(message);
  } catch (error) {
    // If an error occurs during the process, handle and respond with an error status
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };