const asyncHandler = require("express-async-handler");
const Chat = require("../Models/chatModel");
const User = require("../Models/userModel");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  // Extract userId from the request body
  const { userId } = req.body;

  // Check if userId is provided
  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400); // Send 400 Bad Request if userId is not provided
  }

  // Check if a chat already exists between the current user and the specified user
  var isChat = await Chat.find({
    isGroupChat: false, // Only consider individual chats (not group chats)
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } }, // Check if current user is in the users array
      { users: { $elemMatch: { $eq: userId } } }, // Check if specified user is in the users array
    ],
  })
    .populate("users", "-password") // Populate the 'users' field, excluding passwords
    .populate("latestMessage"); // Populate the 'latestMessage' field

  // Populate sender details for latest message
  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  // If a chat exists, send the chat data
  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // If no chat exists, create a new chat between the current user and the specified user
    var chatData = {
      chatName: "sender", 
      isGroupChat: false, // Individual chat
      users: [req.user._id, userId], // Array of user IDs involved in the chat
    };

    try {
      // Create the new chat
      const createdChat = await Chat.create(chatData);

      // Retrieve the newly created chat and populate the 'users' field
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );

      // Send the newly created chat data
      res.status(200).json(FullChat);
    } catch (error) {
      // If an error occurs during chat creation, handle and respond with an error status
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected

const fetchChats = asyncHandler(async (req, res) => {
  try {
    // Find chats where the current user is involved
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      // Populate the 'users' field, excluding passwords
      .populate("users", "-password")
      // Populate the 'groupAdmin' field, excluding passwords
      .populate("groupAdmin", "-password")
      // Populate the 'latestMessage' field
      .populate("latestMessage")
      // Sort the results by 'updatedAt' field in descending order
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        // Populate sender details for latest message
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        // Send the populated chat data to the client
        res.status(200).send(results);
      });
  } catch (error) {
    // If an error occurs during the process, handle and respond with an error status
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};