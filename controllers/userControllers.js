const asyncHandler = require("express-async-handler");
const User = require("../Models/userModel");
const Chat = require("../Models/chatModel");
const generateToken = require("../config/generateToken");
const { TRACK_KEYS, TRACK_TITLES } = require("../config/trackCatalog");

//@description     Get or Search all users
//@route           GET http://localhost:5000/api/user?search=
//@access          Public

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

//@description     Register new user
//@route           POST http://localhost:5000/api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json(
       resobj = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      selectedTracks: user.selectedTracks,
      token: generateToken(user._id),
    });
    console.log(resobj);

  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

//@description     Auth the user
//@route           POST http://localhost:5000/api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
     res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      selectedTracks: user.selectedTracks,
      token: generateToken(user._id),
    });
    // console.log(res);
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

//@description     Update user track selections and join track chats
//@route           PUT http://localhost:5000/api/user/tracks
//@access          Protected
const setUserTracks = asyncHandler(async (req, res) => {
  const { tracks } = req.body;

  if (!Array.isArray(tracks) || tracks.length === 0) {
    res.status(400);
    throw new Error("Select at least one track");
  }

  const normalized = tracks.map((track) => String(track).trim());
  const invalid = normalized.filter((track) => !TRACK_KEYS.has(track));

  if (invalid.length > 0) {
    res.status(400);
    throw new Error("Invalid track selection");
  }

  const uniqueTracks = Array.from(new Set(normalized));
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { selectedTracks: uniqueTracks },
    { new: true }
  );

  for (const trackKey of uniqueTracks) {
    const trackTitle = TRACK_TITLES[trackKey] || trackKey;
    let trackChat = await Chat.findOne({ isTrackChat: true, trackKey });

    const wasMember = trackChat?.users?.some(
      (trackUser) => trackUser.toString() === req.user._id.toString()
    );

    if (!trackChat) {
      trackChat = await Chat.create({
        chatName: trackTitle,
        users: [req.user._id],
        isGroupChat: true,
        groupAdmin: req.user._id,
        isTrackChat: true,
        trackKey,
        trackTitle,
      });
    } else {
      await Chat.updateOne(
        { _id: trackChat._id },
        { $addToSet: { users: req.user._id } }
      );
    }

    const populatedTrackChat = await Chat.findOne({ isTrackChat: true, trackKey })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage");

    const io = req.app.get("io");
    if (io && populatedTrackChat?.users && !wasMember) {
      populatedTrackChat.users.forEach((chatUser) => {
        io.to(chatUser._id.toString()).emit("group updated", {
          chat: populatedTrackChat,
          type: "group-user-added",
          actorId: req.user._id.toString(),
          actorName: req.user.name,
          userId: req.user._id.toString(),
          addedUserName: req.user.name,
        });
      });
    }
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    pic: user.pic,
    selectedTracks: user.selectedTracks,
    token: generateToken(user._id),
  });
});

module.exports = { allUsers, registerUser, authUser, setUserTracks };
